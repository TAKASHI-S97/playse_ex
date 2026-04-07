/*
    ティラノビルダープラグイン開発用のテンプレート
    まず、このファイルを編集してプラグイン開発を試してみると良いでしょう。    
*/

'use strict';
module.exports = class plugin_setting {
    
    constructor(TB) {
        
        /* TBはティラノビルダーの機能にアクセスするためのインターフェスを提供する */
        this.TB = TB;
        
        /* プラグイン名を格納する */
        this.name= TB.$.s("効果音再生EX");
        
        /*プラグインの説明文を格納する*/
        this.plugin_text= TB.$.s("効果音再生がピッチ修正可能になりました。");
        
        /*プラグイン説明用の画像ファイルを指定する。プラグインフォルダに配置してください*/
        this.plugin_img = "no_image";
        
    }
    
    
    /* プラグインをインストールを実行した時１度だけ走ります。フォルダのコピーなどにご活用ください。*/
    triggerInstall(){
        
        /*
        //プラグインからプロジェクトにファイルをコピーするサンプルです 
        var project_path = TB.getProjectPath() ; 
        var from_path = project_path + "data/others/plugin/plugin_template/copy_folder";
        var to_path = project_path + "data/image/copy_folder";
        TB.io.copy(from_path,to_path);
        */
        
    }
        
    /*
        追加するコンポーネントを定義します。
    */
    
    defineComponents(){
        
        var cmp = {};
        var TB = this.TB;
        
        
        /*サウンドファイル選択の動作確認ができるサンプル*/
        cmp["playse_ex"] = {
            
            "info":{
                
                "default":true, /*trueを指定するとコンポーネントがデフォルトで配置されます。*/
                "name":TB.$.s("効果音再生EX"), /* コンポーネント名称 */
                "help":TB.$.s("効果音にピッチ修正を加えて再生"), /* コンポーネントの説明を記述します */ 
                "icon":TB.$.s("s-icon-star-full") /* ここは変更しないでください */
                
            },
            
            /* コンポーネントの情報の詳細を定義します */
            
            "component":{
                
                name : TB.$.s("効果音再生EX"), /* コンポーネント名称 */
                
                /*
                    headerが定義されている場合、タイムライン上のコンポーネントバー部分の文字列を自由に設定できます。
                    以下の例はジャンプ先のシナリオ名とターゲットをバーに表示させて視認性を確保します。
                */
                header : function(obj) {
                    
                    let keyString = "0";
                    if (obj.data.pm.pitch > 0) {
                        keyString = "+" + parseInt(obj.data.pm.pitch / 100).toString();
                    } else if (obj.data.pm.pitch < 0) {
                        keyString = "-" + parseInt(Math.abs(obj.data.pm.pitch) / 100).toString();
                    }

                    return obj.data.pm.storage + "  " + keyString;
                    
                },
        
                component_type : "Sound", /*タイムラインのコンポーネントタイプ Simpleはバーのみ */
                
                /*ビューに渡す値*/
                default_view : {
                    
                    base_sound_url : "data/sound/", /* soundフォルダから選択させる場合は data/sound に変更 */
                    icon : "s-icon-star-full", /*変更しない*/
                    icon_color : "#FFFF99", /*変更しない*/
                    category : "plugin", /*変更しない*/
                    
                },
                
                /*変更しない*/
                param_view : {
                },
                
                            
                /* コンポーネントのパラメータを定義していきます */
                param : {
                    
                    storage : {
                        type : "SoundSelect",   /*パラメータのタイプです。これは画像選択の場合*/
                        file_path : "sound/", /* 効果音の場合はsoundに変更 */
                        name : TB.$.s("効果音"),
                        vital : true, //必須かどうか
                        default_val : "",
                    },
                    
                    volume : {
                        type : "Num",
                        name : TB.$.s("音量"),
                        unit : TB.$.s("%"),
                        validate : {
                            number : true
                        },
                        spinner : {
                            min : 0,
                            max : 100,
                            step : 10
                        },
                        default_val : 100
                    },
                    loop : {
                        type : "Check",
                        text : TB.$.s("ループ再生する"),
                        default_val : "false",
                        name : "",
                    },
                    buf : {
                        type : "Select",
                        name : TB.$.s("チャンネル"),
                        select_list : () => {

                            // Config.tjs のパス
                            const projectPath = TB.getProjectPath();
                            const configPath = projectPath + "data/system/Config.tjs";

                            // ファイル読み込み
                            const text = TB.io.readFile(configPath);

                            // defaultSoundSlotNum を抽出
                            const match = text.match(/defaultSoundSlotNum\s*=\s*(\d+)/);
                            const maxSlot = match ? parseInt(match[1]) : 8; // デフォルト8

                            // 0〜maxSlot-1 の配列を作る
                            const list = [];
                            for (let i = 0; i < maxSlot; i++) {
                                list.push({
                                    name : TB.$.s(i.toString()),
                                    val : i
                                });
                            }

                            return list;
                        },
                        default_val : {
                            name : TB.$.s("0"),
                            val : 0
                        },
                        help : TB.$.s("効果音を再生するチャンネルを指定します")
                    },
                    /* ビルダーユーザーには、入力ミスを防ぐため、入力 UI を提供しない
                    sprite_time : {
                        type : "Text",
                        name : TB.$.s("再生開始と終了時間"),
                        help : TB.$.s("再生開始と終了時間を秒単位で SS.S-EE.E の形式で入力、例：0.5-1.2（500ミリ秒から開始、1秒200ミリ秒の位置で終了）")
                    },
                    */
                    clear : {
                        type : "Check",
                        text : TB.$.s("他の効果音を打ち消す"),
                        default_val : false
                    },
                    pitch : {
                        type : "Num",
                        name : "ピッチ",
                        help : TB.$.s("調整するピッチを指定、「1キー」は+-100です。「1オクターブ」は+-1200"),
                        default_val : 0,
                        spinner : {
                            min : -10000, /*入力の最小値*/
                            max : 10000, /*入力の最大値*/
                            step : 100 /*スピナーを１回動かした時のステップ値*/
                        },
                        validate : {
                            number : true /*数値か否かのチェックを有効化*/
                        }
                    }
                },                    
                            
            }
            
        };
        
                
        return cmp;
    
        
    }
    
    test(){
        
        
    }
        
}

