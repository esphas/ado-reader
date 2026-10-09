import { Howl } from "howler";
import PluginModel from "../../models/Plugin";
import { getAllVoices, getFormatFromAudioPath } from "../common";

import { isElectron } from "react-device-detect";
import { TextRule } from "../common";

const escapeRegExp = (pattern: string) =>
  pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class TTSUtil {
  static player: any;
  // 听书文本规则（replace / delete），朗读前应用到文本
  static textRules: TextRule[] = [];
  static audioPaths: { index: number; audioPath: string }[] = [];
  static isPaused: boolean = false;
  static pausedMidSentence: boolean = false;
  static processingIndexes: Set<number> = new Set();
  static async readAloud(currentIndex: number) {
    // 清理比当前 index 小 10 的已朗读缓存
    this.audioPaths = this.audioPaths.filter(
      (item) => item.index >= currentIndex - 10
    );
    return new Promise<string>(async (resolve) => {
      let audioPath = this.audioPaths.find(
        (item) => item.index === currentIndex
      )?.audioPath;
      if (!audioPath) {
        resolve("loaderror");
        return;
      }
      var sound = new Howl({
        src: [audioPath],
        format: [getFormatFromAudioPath(audioPath)],
        onloaderror: () => {
          resolve("loaderror");
        },
        onload: async () => {
          this.player.play();
          resolve("load");
        },
      });
      this.player = sound;
    });
  }
  static async cacheAudio(
    startIndex: number,
    speed: number,
    plugins: PluginModel[],
    audioNodeList: {
      text: string;
      voiceName: string;
      voiceEngine: string;
    }[],
    targetCacheCount: number
  ) {
    this.isPaused = false;

    let maxCacheIndex = Math.min(
      startIndex + targetCacheCount,
      audioNodeList.length
    );
    for (let index = startIndex; index < maxCacheIndex; index++) {
      if (this.isPaused) {
        break;
      }
      // 如果已经缓存过或正在处理中，跳过
      if (
        this.audioPaths.find((item) => item.index === index) ||
        this.processingIndexes.has(index)
      ) {
        continue;
      }
      // 标记为正在处理
      this.processingIndexes.add(index);
      const audioNode = audioNodeList[index];
      let plugin = plugins.find((item) => item.key === audioNode.voiceEngine);
      if (!plugin) {
        return "error";
      }
      let voice = (plugin.voiceList as any[]).find(
        (voice) => voice.name === audioNode.voiceName
      );
      if (!voice) {
        return "error";
      }
      let audioPath = await this.getAudioPath(audioNode.text, speed, plugin, voice);
      // 处理完成后，从处理集合中移除
      this.processingIndexes.delete(index);
      if (audioPath) {
        this.audioPaths.push({ index: index, audioPath: audioPath });
      } else {
        this.isPaused = true;
        break;
      }
    }
  }
  static async pauseAudio() {
    if (this.player) {
      this.player.pause();
      this.isPaused = true;
      this.pausedMidSentence = true;
    }
  }
  static resumeAudio(): boolean {
    if (this.player && this.pausedMidSentence) {
      this.player.play();
      this.isPaused = false;
      this.pausedMidSentence = false;
      return true;
    }
    return false;
  }
  static async stopAudio() {
    if (this.player && this.player.stop) {
      this.player.stop();
      this.isPaused = true;
      this.pausedMidSentence = false;
      setTimeout(() => {
        this.clearAudioPaths();
        this.audioPaths = [];
        this.processingIndexes.clear();
      }, 1000);
    }
  }
  static async clearAudioPaths() {
    if (!isElectron) return;
    window.electronAPI.invoke("clear-tts");
  }
  static getAudioPaths() {
    return this.audioPaths;
  }
  static async getAudioPath(
    text: string,
    speed: number,
    plugin,
    voice
  ) {
    // 朗读前应用文本替换 / 删除规则
    text = this.applyTextRules(text);
    const payload: Record<string, unknown> = {
      text: text,
      speed,
      pluginKey: plugin.key,
      config: voice.config,
    };
    if (plugin.script) {
      payload.script = plugin.script;
      if (plugin.scriptSHA256) {
        payload.scriptSHA256 = plugin.scriptSHA256;
      }
    }
    let audioPath = await window.electronAPI.invoke("generate-tts", payload);
    return audioPath;
  }
  static setAudioPaths() {
    this.audioPaths = [];
    this.processingIndexes.clear();
    this.pausedMidSentence = false;
  }
  static getPlayer() {
    return this.player;
  }
  static getVoiceList(plugins: PluginModel[]) {
    let voices = getAllVoices(plugins);

    return voices;
  }
  // 设置听书文本规则（仅 replace / delete 生效）
  static setTextRules(rules: TextRule[]) {
    this.textRules = rules.filter(
      (rule) => rule.type === "replace" || rule.type === "delete"
    );
  }
  // 对文本应用替换 / 删除规则
  static applyTextRules(text: string): string {
    if (!text || this.textRules.length === 0) return text;
    let result = text;
    for (const rule of this.textRules) {
      try {
        const regex =
          rule.matchType === "regex"
            ? new RegExp(rule.pattern, "g")
            : new RegExp(escapeRegExp(rule.pattern), "g");
        if (rule.type === "delete") {
          result = result.replace(regex, "");
        } else {
          // regex 模式保留 $1 分组引用（由 String.replace 原生处理）；
          // plain 模式转义 $ 防止被解释为分组引用
          const replacement =
            rule.matchType === "regex"
              ? rule.replacement || ""
              : (rule.replacement || "").replace(/\$/g, "$$$$");
          result = result.replace(regex, replacement);
        }
      } catch (e) {
        console.error("Invalid text rule pattern:", rule.pattern, e);
      }
    }
    return result;
  }
}
export default TTSUtil;
