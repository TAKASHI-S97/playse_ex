;(() => {
  const that = TYRANO
  const audioContext = new AudioContext();

  // =======================================
  // #[playse_ex]
  // =======================================
  that.kag.ftag.master_tag['playse_ex'] = {
    vital: ["storage"],
    pm: {
      storage: "",
      volume: "",
      loop: "false",
      buf: "0",
      sprite_time: "",
      clear: "false",
      pitch: "0",
    },
    waitClick: function (pm) {
      that.kag.weaklyStop();
      $(".tyrano_base").on("click.se", () => {
        that.kag.readyAudio();
        this.play(pm);
        $(".tyrano_base").off("click.se");
      });
    },
    start: function (pm) {
      // clear が true の場合、全スロットの効果音を停止
      if (pm.clear === 'true') {
        that.kag.ftag.startTag("stopbgm", {
          target: "se",
          stop: "true",
          buf_all: "true",
        });

      // clear が false の場合、同じスロットの効果音を停止
      } else {
        that.kag.ftag.startTag("stopse", { buf: pm.buf });
      }

      // ここから kag.tag_audio.js を参考に改造
      if (!that.kag.stat.play_se) {
        that.kag.ftag.nextOrder();
        return;
      }

      if ($.userenv() !== "pc" && that.kag.stat.is_skip) {
        that.kag.ftag.nextOrder();
      } else {
        if (that.kag.tmp.ready_audio) {
          this.play(pm);
        } else {
          this.waitClick(pm);
        }
      }
    },
    play: async function (pm) {
      const buf = pm.buf,
        is_loop = pm.loop === "true";

      that.kag.weaklyStop();

      const next = () => {
        this.kag.cancelWeakStop();
        this.kag.ftag.nextOrder();
      };

      let storage = $.parseStorage(pm.storage, "sound");
      
      let tag_volume = pm.volume === "" ? 1 : $.parseVolume(pm.volume);
      let config_volume = 
        that.kag.stat.map_se_volume[buf] !== undefined
          ? $.parseVolume(that.kag.stat.map_se_volume[buf])
          : $.parseVolume(that.kag.config.defaultSeVolume);
      const volume = tag_volume * config_volume;

      that.kag.tmp.is_se_play = true;

      that.kag.stat.current_bgm_base64 = "";

      // このプラグインでは Web Audio API を使用するため、ここから先は独自処理
      // （本家は Howler）

      // AudioBufferSourceNode の作成
      const source = audioContext.createBufferSource();

      // GainNode の作成
      const gainNode = audioContext.createGain();

      // 本家からの干渉を対応するためのラッパー
      const wrapper = {
        source: source,
        gain : gainNode,
        _loop: is_loop,
        is_playing: true,

        stop() {
          try { this.source.stop(); } catch(e) {}
          this.is_playing = false;
        },

        unload() {
          try { this.source.disconnect(); } catch(e) {}
          try { this.gain.disconnect(); } catch(e) {}
          this.source = null;
          this.gain = null;
        },

        playing() {
          return this.is_playing;
        },
      }

      // 音源のバッファを設定
      source.buffer = await loadAudio(storage);
      if (!source.buffer) {
        next();
        return;
      }

      // 音量の設定
      gainNode.gain.value = volume;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // キー（ピッチ）を指定
      source.detune.value = parseInt(pm.pitch);

      // ループするかどうかを指定
      source.loop = is_loop;

      // 再生開始終了タイムを指定して再生
      let offset = 0;
      let duration = undefined;

      if (pm.sprite_time) {
        const [start, end] = pm.sprite_time.split("-").map(Number);
        offset = start;
        duration = end - start;
      }

      if (duration !== undefined) {
        source.start(0, offset, duration);
      } else {
        source.start(0, offset);
      }    

      // 本家のを引き続き踏襲
      // ただし kag.tmp.map_se に入る Howl のオブジェクトを wrapper に置き換え
      // （AudioBufferSourceNode に存在しない unload メソッド等を対応するため）
      if (that.kag.tmp.map_se[buf]) {
        that.kag.tmp.map_se[buf].stop();
        that.kag.tmp.map_se[buf].unload();
      }
      that.kag.tmp.map_se[buf] = wrapper;

      if (is_loop) {
        (that.kag.stat.current_se ??= {})[buf] = $.extend({}, pm);
      } else {
        delete that.kag.stat.current_se?.[buf];

        source.onended = () => {
          wrapper.is_playing = false;
          that.kag.tmp.is_se_play = false;

          if (that.kag.tmp.is_se_play_wait) {
            let is_sound_playing = false;
            for (const key in that.kag.tmp.map_se) {
              const wrapper = that.kag.tmp.map_se[key];
              if (!wrapper._loop && wrapper.playing()) {
                is_sound_playing = true;
                break;
              }
            }
            if (!is_sound_playing) {
              that.kag.tmp.is_se_play_wait = false;
              that.kag.ftag.nextOrder();
            }
          }
        };
      }

      next();
    },
  }

  // =======================================
  // 音声読込処理
  // =======================================
  async function loadAudio(storage) {
    let buffer;
    
    try {
      const response = await fetch(storage);
      buffer = await audioContext.decodeAudioData(await response.arrayBuffer());
    } catch (err) {
      console.error(`Unable to fetch the audio file. Error: ${err.message}`);
    }

    return buffer;
  }
})();
