/*
* Script Name: BBCode SOS Formatter for Discord
* Version: v1.0.0
* Last Updated: 2024-10-14
* Author: NunoF-
* Author URL: https://nunoferr.github.io/
* Author Contact: Discord - ducks4ever
* Approved: Yes
* Approved Date: 2024-10-24
* Forum URL (.net): https://forum.tribalwars.net/index.php?threads/bbcode-sos-formatter-for-discord.293058/
* Mod: RedAlert
*/

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

 if (typeof bbCodeSOSFormatter !== 'undefined') {
    bbCodeSOSFormatter.init();
 } else {
 class BBCodeSOSFormatter {
    static BBCodeSOSFormatterTranslations = {
        en_US: {
            bbCodeWindow: {
                title: 'BBCode (SOS) Formatter for Discord',
                instruction: 'Insert the BBCode here...',
                generate: 'Format',
                cancel: 'Cancel',
                credits: 'BBCode (SOS) Formatter for Discord v1.0.0 by NunoF- (.com.pt)'
            },
            textContent: {
                villageForSnipe: 'Village for snipe X',
                sigil: 'Sigil'
            }
        },
        pt_PT: {
            bbCodeWindow: {
                title: 'Formatador de BBCode (SOS) para Discord',
                instruction: 'Inserir o BBCode aqui...',
                generate: 'Formatar',
                cancel: 'Cancelar',
                credits: 'Formatador de BBCode (SOS) para Discord v1.0.0 by NunoF- (.com.pt)'
            },
            textContent: {
                villageForSnipe: 'Aldeia para snipe X',
                sigil: 'Sigilia'
            }
        }
    };

    constructor() {
        this.UserTranslation = game_data.locale in BBCodeSOSFormatter.BBCodeSOSFormatterTranslations ? this.UserTranslation = BBCodeSOSFormatter.BBCodeSOSFormatterTranslations[game_data.locale] : BBCodeSOSFormatter.BBCodeSOSFormatterTranslations.en_US;
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
        var html = `<div class="BBCodeSOSFormatterContainer"><h2>${this.UserTranslation.bbCodeWindow.title}</h2>
        <textarea id="bbCodeText" placeholder="${this.UserTranslation.bbCodeWindow.instruction}"></textarea>
        <br><br>
        <button class="btn evt-confirm-btn btn-confirm-yes" id="bbCodeBtn" onclick="bbCodeSOSFormatter.format()">${this.UserTranslation.bbCodeWindow.generate}</button>
        <button class="btn evt-cancel-btn btn-confirm-no" onclick="Dialog.close()">${this.UserTranslation.bbCodeWindow.cancel}</button><br></div>
        <span class="creditsSection">${this.UserTranslation.bbCodeWindow.credits}</span>`;

        var stylesheet = `
        <style>
        .BBCodeSOSFormatterContainer {
            min-width:80%;
            height: calc(100% - 40px);
            margin-bottom: 16px;
            text-align:center;
        }

        .BBCodeSOSFormatterContainer textarea {
            width: 90%;
            height: calc(100% - 80px);
        }

        .popup_box_content .creditsSection {
                width: calc(100% + 18px);
                position: absolute;
                left: -9px;bottom: -9px;
                margin-bottom: 0px;
                border-radius: 0px 0 8px 8px;
                background-image: url(https://dspt.innogamescdn.com/asset/2a2f957f/graphic/screen/tableheader_bg3.png);
                background-repeat: round;
                text-align: center;
                font-weight: bold;
                font-size: 10px;
                line-height: 2;
            }
        </style>`;

        html += stylesheet;
        this.#createDialog('import', html, Dialog.close());
        $('#popup_box_import').css('min-width', '80%');
        $('#popup_box_import').css('height', '80%');
        $('#popup_box_import').children("div").css('height', '100%');
    }

    async format() {
        var villages = await getVillages();
        var players = await fetchPlayers();

        var bbCodeText = $('#bbCodeText').val();

        removeWall();

        removeGeneralBBCode();

        formatMainText(this.UserTranslation);

        formatDate();

        formatMilliseconds();

        removeExtraLines();

        $('#bbCodeText').val(bbCodeText);

        async function getVillages() {
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
                    UI.ErrorMessage(error);
                    console.error('${scriptInfo} Error:', error);
                    throw error;
                }
            }
            return formattedVillages;
        }

        async function fetchPlayers() {
            try {
                const playersFromSdk = await twSDK.worldDataAPI('player');
                return { playersFromSdk };
            } catch (error) {
                UI.ErrorMessage(error);
                console.error('${scriptInfo} Error:', error);
                throw error;
            }
        }

        function removeWall() {
            bbCodeText = bbCodeText.replaceAll(/\[\/coord\]\n.+?\[\/b\].*/g, '[/coord]');
        }

        function removeGeneralBBCode() {
            bbCodeText = bbCodeText.replaceAll(/\[command\].*\[\/command\]/g, '**');
            bbCodeText = bbCodeText.replaceAll('[b]', '');
            bbCodeText = bbCodeText.replaceAll('[/b]', '');
            bbCodeText = bbCodeText.replaceAll(/ \[player\].*/g, '');
            bbCodeText = bbCodeText.replaceAll(/.*\d+  \d+  \d+  \d+  \d+  \d+  \d+  \d+  \d+  \d+  \d*/g, '');
            bbCodeText = bbCodeText.replaceAll(/^ +/gm, '');
            bbCodeText = bbCodeText.replaceAll('\n** ', '\n**');
            bbCodeText = bbCodeText.replaceAll(' **', '**');
        }

        function formatMainText(UserTranslation) {
            var villageLineRegex = /(\n|^)(?=((.*): \[coord\](\d{3}\|\d{3})\[\/coord\]))/;
            while (bbCodeText.search(villageLineRegex) != -1) {
                var playerVillageLine = villageLineRegex.exec(bbCodeText);
                var villageCoords = playerVillageLine[4];
                var player = players.playersFromSdk.find(player => player[0] === villages[villageCoords][4])[1];
                var villageDetails = `---------------------
${UserTranslation.textContent.villageForSnipe}: **${villageCoords}**
${getPlayerText()} ${player}
${UserTranslation.textContent.sigil}: X%`;
                bbCodeText = bbCodeText.replace(playerVillageLine[2], villageDetails);
            }

            bbCodeText = bbCodeText.replaceAll(' [coord]', '** ');
            bbCodeText = bbCodeText.replaceAll('[/coord]', '');

            function getPlayerText() {
                const gamePlayerCode = '86eaf6742dd45d73c45f3f65306701e1';
                return window.lang[gamePlayerCode];
            }
        }

        function formatDate() {
            // Codes for the strings containing the months names stored on window.lang, collected from the website assets
            const gameMonthsCodes = {
                'f0eadcecffbb5f66bf549645d20bd0cd': 1,
                'b8a8de82dd0387e97241d76edb64c78e': 2,
                '99d26c335ff06a1f4f32e1b78ccc0855': 3,
                '2d0ea4e2a5d29e1321ae6d9ff1861052': 4,
                'c0a48f32c11d4e56173d7bb151154236': 5,
                '00a5cf879180a196bf1720187b4a29ba': 6,
                '23176c991f48ba3a17942b82cc7787b2': 7,
                '19c1b76c51e0eb5d5c92221e6e891bad': 8,
                '1f17626a373b6a69f8287ed8781e1e0a': 9,
                '4caa55b7c609d00fb95f03cd1ceafeab': 10,
                'b575d8d37fffa782cfa3592d1cfc65da': 11,
                'a0bccd9315fa3e38aef93f34cd116aa9': 12
            };

            var gameTranslations = {};
            $.each(gameMonthsCodes, function(langCode, month) {
                gameTranslations[window.lang[langCode].toLowerCase()] = month;
            });

            $.each(gameTranslations,function(key, val) {
                // PT (and mostly global?) date format - Converts, for example, jan. to 01 / fev. to 02 / ...
                bbCodeText = bbCodeText.replace(new RegExp(`${key}\\.`, 'ig'), val);
                
                // Same as above, but for .NET
                var otherServersDateFormat = new RegExp(`${key}\\s\\d{1,2},\\s\\d{4}`, "ig");
                var daysLinesForThatMonth = Array.from(new Set(bbCodeText.match(otherServersDateFormat))) ;
                while (daysLinesForThatMonth.length !== 0) {
                    var currentLine = daysLinesForThatMonth[0];
                    var year = /\d{4}/.exec(currentLine);
                    var day = /\d{2}/.exec(currentLine);
                    bbCodeText = bbCodeText.replaceAll(currentLine, `${day}/${val}/${year}`);
                    daysLinesForThatMonth.shift();
                }
            });
        }

        function formatMilliseconds() {
            var timeRegex = /\s(\s|\()\d\d:\d\d:\d\d\){0,1}/;
            while (bbCodeText.search(timeRegex) !== -1) {
                var timeStr = timeRegex.exec(bbCodeText)[0];
                if (timeStr.indexOf('(') !== -1) { // Most servers
                    bbCodeText = bbCodeText.replace(timeStr, ' ' + timeStr.substring(2, 10));
                } else { // .net server
                    bbCodeText = bbCodeText.replace(timeStr, ' ' + timeStr.trim())
                }
            }
        }

        function removeExtraLines(){
            bbCodeText = bbCodeText.replaceAll('\n\n\n', '\n');
        }
    }
    
    async #loadtwSDK() {
        await new Promise((resolve, reject) => {
            $.getScript('https://twscripts.dev/scripts/twSDK.js')
                .done(async function() { resolve();})
                .fail((jqxhr, settings, exception) => {
                    UI.ErrorMessage('Failed to load twSDK.<br>Please try again.');
                    console.error('Script loading failed:', exception);
                    reject(exception);
            });
        });
    }
 
}

var bbCodeSOSFormatter = new BBCodeSOSFormatter();
bbCodeSOSFormatter.init();
}