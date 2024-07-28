/*
* Script Name: BBCode Attack Formatter for Discord
* Version: v1.0
* Last Updated: 2024-07-27
* Author: NunoF-
* Author URL: https://nunoferr.github.io/
* Author Contact: Discord - ducks4ever#quack
* Approved: No approval required
* Approved Date: No approval required
* Mod: No approval required
*/

class BBCodeAttackFormatter {
    static BBCodeAttackFormatterTranslations = {
        en_US: {
            bbCodeWindow: {
                title: 'BBCode Attack Formatter for Discord',
                instruction: 'Insert the BBCode here...',
                generate: 'Fix',
                cancel: 'Cancel'
            },
            textContent: {
                villageForSnipe: 'Village for snipe X: '
            }
        },
        pt_PT: {
            bbCodeWindow: {
                title: 'Formatador de BBCode para Discord',
                instruction: 'Inserir o código BBCode aqui...',
                generate: 'Formatar',
                cancel: 'Cancelar'
            },
            textContent: {
                villageForSnipe: 'Aldeia para snipe X: '
            }
        }
    };

    constructor() {
        this.UserTranslation = game_data.locale in BBCodeAttackFormatter.BBCodeAttackFormatterTranslations ? this.UserTranslation = BBCodeAttackFormatter.BBCodeAttackFormatterTranslations[game_data.locale] : BBCodeAttackFormatter.BBCodeAttackFormatterTranslations.en_US;
    }

    async init() {
        await this.#loadtwSDK();
        this.#openUI();
    }

    #createDialog(type, dialogContent, endFunction) {
        var i = $.extend({
            class_name: '',
            close_from_fader: !0,
            auto_width: !1,
            allow_close: 1,
            priority: Dialog.PRIORITY_NONE,
            subdialog: !0,
            body_class: 'dialog-open'
        });
        Dialog.show(type, dialogContent, endFunction, i);
    }

    #openUI() {
        var html = '<div style="text-align:center;min-width:80%;"><h2>' + this.UserTranslation.bbCodeWindow.title + '</h2>' + 
        '<textarea style="width: 90%; height: 80%;" id="bbCodeText" placeholder="' + this.UserTranslation.bbCodeWindow.instruction + '"></textarea>' +
        '<br><br><button class="btn evt-confirm-btn btn-confirm-yes" id="bbCodeBtn" onclick="bBCodeAttackFormatter.format()">' + this.UserTranslation.bbCodeWindow.generate + '</button><button class="btn evt-cancel-btn btn-confirm-no" onclick="Dialog.close()">' +
        this.UserTranslation.bbCodeWindow.cancel + '</button><br></div>';
        this.#createDialog('import', html, Dialog.close());
        $('#popup_box_import').css('min-width', '80%');
        $('#popup_box_import').css('height', '80%');
        $('#popup_box_import').children("div").css('height', '100%');
        $('#popup_box_import').children("div").children("div").css('height', '100%');
    }

    async format() {
        var villages = await this.#getVillages();
        var playersFromSdk = [];
        var players = await fetchPlayers(playersFromSdk);

        var bbCodeText = $('#bbCodeText').val();
        bbCodeText = bbCodeText.replaceAll(/\n.*muralha.*/g, '');
        bbCodeText = bbCodeText.replaceAll(/\[command\].*\[\/command\]/g, '**');
        bbCodeText = bbCodeText.replaceAll('[coord]', '** ');
        bbCodeText = bbCodeText.replaceAll('[/coord]', '');
        bbCodeText = bbCodeText.replaceAll('[b]', '');
        bbCodeText = bbCodeText.replaceAll('[/b]', '');
        bbCodeText = bbCodeText.replaceAll(/ \[player\].*\[\/player\]/g, '');
        bbCodeText = bbCodeText.replaceAll(/.*\d+  \d+  \d+  \d+  \d+  \d+  \d+  \d+  \d+  \d+  \d*/g, '');
        bbCodeText = bbCodeText.replaceAll(/^ +/gm, '');
        bbCodeText = bbCodeText.replaceAll('\n** ', '\n**');
        bbCodeText = bbCodeText.replaceAll(' **', '**');
        bbCodeText = bbCodeText.replaceAll('jul.', '07');
        
        while (bbCodeText.search(/\(\d\d:\d\d:\d\d\)/g) != -1) {
            bbCodeText = bbCodeText.replace(/\(\d\d:\d\d:\d\d\)/g, /\d\d:\d\d:\d\d/.exec(bbCodeText)[0]);
        }
        
        while (bbCodeText.search(/Aldeia:\*\* \d{3}\|\d{3}/) != -1) {
            var villageCoords = /Aldeia:\*\* (\d{3}\|\d{3})/.exec(bbCodeText)[1];
            var player = '\nJogador: ' +  players.playersFromSdk.find(player => player[0] === villages[villageCoords][4])[1];
            var villageDetails = '---------------------\n\n' + this.UserTranslation.textContent.villageForSnipe + villageCoords + player + '\nSigilia: X%';
            bbCodeText = bbCodeText.replace(/Aldeia:\*\* \d{3}\|\d{3}/, villageDetails);
        }

        bbCodeText = bbCodeText.replaceAll('\n\n\n', '\n');
        $('#bbCodeText').val(bbCodeText);

        async function fetchPlayers() {
            try {
                const playersFromSdk = await twSDK.worldDataAPI('player');
                return { playersFromSdk };
            } catch (error) {
                playersFromSdk = 'error';
                UI.ErrorMessage(error);
                console.error(`${scriptInfo} Error:`, error);
            }
        }
    }

    async #getVillages() {
        var villagesFromSdk = [];
        var villages = await fetchVillages(villagesFromSdk);
        var formattedVillages = [];
        villages['villagesFromSdk'].forEach((village) => {
            formattedVillages[village[2] + '|' + village[3]] = village;
        });

        async function fetchVillages() {
            try {
                const villagesFromSdk = await twSDK.worldDataAPI('village');
                return { villagesFromSdk };
            } catch (error) {
                villagesFromSdk = 'error';
                UI.ErrorMessage(error);
                console.error(`${scriptInfo} Error:`, error);
            }
        }
        return formattedVillages;
    }
    
    async #loadtwSDK() {
        await new Promise((resolve, reject) => {
            $.getScript('https://twscripts.dev/scripts/twSDK.js')
                .done(async function() { resolve();})
                .fail((jqxhr, settings, exception) => {
                console.error('Script loading failed:', exception);
                reject(exception);
            });
        });
    }
 
}

var bBCodeAttackFormatter = new BBCodeAttackFormatter();
bBCodeAttackFormatter.init();