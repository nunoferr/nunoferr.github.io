/*
* Script Name: BBCode SOS Formatter for Discord
* Version: v1.0
* Last Updated: 2024-10-12
* Author: NunoF-
* Author URL: https://nunoferr.github.io/
* Author Contact: Discord - ducks4ever
* Approved: 
* Approved Date: 
* Forum URL (.net): 
* Mod: 
*/

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/


 class GetVillagesOfTribeMembersFromCoords {
    static GetVillagesOfTribeMembersFromCoordsTranslations = {
        en_US: {
            bbCodeWindow: {
                title: 'BBCode SOS Formatter for Discord',
                instruction: 'Insert the BBCode here...',
                generate: 'Fix',
                cancel: 'Cancel'
            }
        },
        pt_PT: {
            bbCodeWindow: {
                title: 'Recolher todas as aldeias entre 2 coords',
                instruction: 'As coords vão ser mostradas aqui...',
                generate: 'Procurar',
                cancel: 'Cancelar'
            }
        }
    };

    constructor() {
        this.UserTranslation = game_data.locale in GetVillagesOfTribeMembersFromCoords.GetVillagesOfTribeMembersFromCoordsTranslations ? this.UserTranslation = GetVillagesOfTribeMembersFromCoords.GetVillagesOfTribeMembersFromCoordsTranslations[game_data.locale] : GetVillagesOfTribeMembersFromCoords.GetVillagesOfTribeMembersFromCoordsTranslations.en_US;
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
        var html = `<div style="text-align:center;min-width:80%;"><h2>${this.UserTranslation.bbCodeWindow.title}</h2>
        <textarea style="width: 90%; height: 80%;" id="bbCodeText" placeholder="${this.UserTranslation.bbCodeWindow.instruction}"></textarea>
        <br><br>
        Inserir 2 coordenadas entre as quais querem um espaço
        <br>
        <input type="text" style="width: 40px;" id="coord-finder-1" placeholder="380|515">
        <input type="text" style="width: 40px;" id="coord-finder-2" placeholder="468|525">
        <br><br>
        Pontos mínimos por aldeia (deixar 0 para incluir todas): <input type="text" style="width: 40px;" id="coord-finder-min-points" value="0">
        <br><br>
        IDs das tribos SEPARADOS POR UMA "," APENAS - (60cm inseridas por defeito)<br>
        (Se deixado em branco conta com todas):<br>
        <input type="text" id="coord-finder-tribes" value="49,44,293">
        <br><br>
        <button class="btn evt-confirm-btn btn-confirm-yes" id="bbCodeBtn" onclick="getVillagesOfTribeMembersFromCoords.format()">${this.UserTranslation.bbCodeWindow.generate}</button>
        <button class="btn evt-cancel-btn btn-confirm-no" onclick="Dialog.close()">${this.UserTranslation.bbCodeWindow.cancel}</button><br></div>`;
        this.#createDialog('import', html, Dialog.close());
        $('#popup_box_import').css('min-width', '80%');
        $('#popup_box_import').css('height', '80%');
        $('#popup_box_import').children("div").css('height', '100%');
        $('#popup_box_import').children("div").children("div").css('height', '100%');
    }

    async format() {
        var villages = await getVillages();
        var playersFromSdk = [];
        var players = await fetchPlayers(playersFromSdk);
        var playerList = {};

        var allowedTribes = $('#coord-finder-tribes').val().replaceAll(' ', '');
        var allowedTribesArr = allowedTribes.length > 0 ? allowedTribes.split(',').map(Number) : 0;

        for (var coord in villages) {
           /* var sss = `
            462|483
462|483
457|482
466|482
467|483
459|481
461|480
462|480
458|482
458|482
462|478
468|477
464|477
464|474
467|473
465|473
462|473
466|481
463|476
466|476
464|474
462|473
465|473
465|473
462|473
465|473
462|473
460|471
460|471
460|470
467|482
463|478
463|477
458|483`;
            if (sss.indexOf(coord) !== -1) continue;*/
            // if (villages[coord][5] <= 500) continue; // not enough points

            if (!(villages[coord][5] >= $('#coord-finder-min-points').val())) continue; // not enough points
            var coords = coord.split("|");
            var x = coords[0];
            var y = coords[1];
            // if (y < 415) {
            // x   y   
            // var pEsquerdaCima = "380|515".split('|');
            // var pDireitaBaixo = "468|520".split('|');
            var pEsquerdaCima = $('#coord-finder-1').val().split('|');
            var pDireitaBaixo = $('#coord-finder-2').val().split('|');

            var xCoords = parseInt(pEsquerdaCima[0]) > parseInt(pDireitaBaixo[0]) ? [pEsquerdaCima[0], pDireitaBaixo[0]] : [pDireitaBaixo[0], pEsquerdaCima[0]];
            var yCoords = parseInt(pEsquerdaCima[1]) > parseInt(pDireitaBaixo[1]) ? [pEsquerdaCima[1], pDireitaBaixo[1]] : [pDireitaBaixo[1], pEsquerdaCima[1]];

            if (y >= yCoords[1] && y <= yCoords[0] && x >= xCoords[1] && x <= xCoords[0]) {
                var ownerPlayerObject = players.playersFromSdk.find(player => player[0] === villages[coord][4]);
                if (ownerPlayerObject === undefined) continue; // barbarian

                var tribe = ownerPlayerObject[2];
                // if (![148, 134, 220, 41, 172].includes(tribe)) continue; // Non Purge / KnowN member
                
                // if (![49, 44, 293].includes(tribe)) continue;  // 60cms
                if (allowedTribesArr.length > 0 && !allowedTribesArr.includes(tribe)) continue;
                var username = ownerPlayerObject[1];
                if (!playerList.hasOwnProperty(username)) playerList[username] = [];
                playerList[username].push(coord);
            }
            
        }

        console.log(playerList);
        print(playerList);

        function print(playerList) {
            var bbCodeText = $('#bbCodeText');
            var content = "\r\n";
            var previousPlayerName = null;
            $.each(playerList, function(playerName, villages) {
                content += `**${playerName}**: `;
                $.each(villages, function(index, village) {
                    content += village + " ";
                });
                content += "\r\n\r\n";
            });
            bbCodeText.html(content);
        }
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
                    villagesFromSdk = 'error';
                    UI.ErrorMessage(error);
                    console.error(`${scriptInfo} Error:`, error);
                }
            }
            return formattedVillages;
        }

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

var getVillagesOfTribeMembersFromCoords = new GetVillagesOfTribeMembersFromCoords();
getVillagesOfTribeMembersFromCoords.init();