/*
* Script Name: Tribe Fulls Calculator
* Version: v1.0
* Last Updated: 2024-09-23
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

 if (typeof tribeTroopsExporter !== 'undefined') {
    tribeTroopsExporter.init();
 } else {
 class TribeTroopsExporter {
    static TribeTroopsExporterTranslations() {
        return {
            en_US: {
                title: 'Tribe Villages Armies Finder',
                instructions: 'Find the armies of your Tribe players that match the following criteria:',
                searchBoxExpandInstruictions: 'Click on the checkboxes to state that you also just want units that are smaller than a given number. Uncheck the checkbox to disabled its effect.',
                findButton: 'Find villages',
                table: {
                    player: 'Player',
                    villages: 'Villages',
                    total: 'Total'
                },
                coordinatesToImport: 'Display coordinates to import to another script',
                loadingMessage: 'Loading',
                successMessage: 'Loaded successfully!',
                errorMessageNoVillagesFound: 'This player either does not have any villages or does not have the "Share owned troops" setting enabled.',
                credits: 'Tribe Villages Armies Finder script v1.0.0 by NunoF- (.com.pt)'
            },
            pt_PT: {
                title: 'Procurar exércitos nas aldeias da tribo',
                instructions: 'Procurar os exército de membros da sua tribo que seguem os seguintes critérios:',
                searchBoxExpandInstruictions: 'Clique nas checkboxes para informar que você também quer apenas unidades que sejam menores do que um certo número. Clique novamente na checkbox para remover este efeito.',
                findButton: 'Procurar aldeias',
                table: {
                    player: 'Jogador',
                    villages: 'Aldeias',
                    total: 'Total'
                },
                coordinatesToImport: 'Mostrar coordenadas para serem importadas para outro script',
                loadingMessage: 'A carregar',
                successMessage: 'Carregado com sucesso!',
                errorMessageNoVillagesFound: 'Este jogador ou não tem aldeias ou não tem a definição de "Partilhar tropas próprias" ativa.',
                credits: 'Procurar exércitos nas aldeias da tribo v1.0.0 por NunoF- (.com.pt)'
            }
        };
    }

    constructor() {
        this.UserTranslation = game_data.locale in TribeTroopsExporter.TribeTroopsExporterTranslations() ? this.UserTranslation = TribeTroopsExporter.TribeTroopsExporterTranslations()[game_data.locale] : TribeTroopsExporter.TribeTroopsExporterTranslations().en_US;
        // this.UserTranslation = tribeTroopsExporter.tribeTroopsExporterTranslations().en_US;
        this.availableSupportUnits = Object.create(game_data.units);
        this.availableSupportUnits.splice(this.availableSupportUnits.indexOf('militia'), 1);
        this.troopsColumnLocation = {};
        this.versionNumber = game_data.version.substring(0, game_data.version.indexOf(' '));
        this.isMobile = $('#mobileHeader').length > 0;
        UnitPopup.whenDataReady(function() { tribeTroopsExporter.init() }); // fetch units data for units automatic translations
    }

    async init() {
        this.#createUI();
    }
    
    #generateUrl(screen, mode = null, extraParams = {}) {
        var url = `/game.php?village=${game_data.village.id}&screen=${screen}`;
        if (mode !== null) url += `&mode=${mode}`;

        $.each(extraParams, function (key, value) {
            url += `&${key}=${value}`;
        });
        if(game_data.player.sitter !== "0") url += "&t=" + game_data.player.id;
        return url;
    }

    async #createUI(runFinder = false) {
        var armiesSection = '';
        armiesSection = createArmiesSection(this.UserTranslation, this.availableSupportUnits, await this.#getTribeArmies());
  
        var html = `
        <h2>Tropas na aldeia e da aldeia (defesa)</h2>
        <div id="tribeArmiesFinder" class="${this.isMobile ? 'mobile-app' : ''}">
            <form>
                ${armiesSection}
            </form>
            ${createStyleElement()}
        </div>
        <div class="creditsSection">${this.UserTranslation.credits}</div>
        `;
        Dialog.show('import', html, Dialog.close());

        $('#popup_box_import').css('width', 'unset');
        setTimeout(() => {
            $('#tribeArmiesFinder .searchTable').css('width', '+=18px');
        }, 300);

        

        function getStylesFromLinks() {
            let styles = '';
            const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
            
            linkElements.forEach(link => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', link.href, false); // Synchronous request
                xhr.send();
                
                if (xhr.status === 200) {
                    styles += xhr.responseText + '\n';
                }
            });
            
            return styles;
        }
        
        function createDownloadLink() {
            function formatDate(date) {
                const pad = num => num.toString().padStart(2, '0');
                return `${date.getFullYear()}_${pad(date.getMonth() + 1)}_${pad(date.getDate())}_-_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
            }
            var a = document.createElement("a");
            var divContent = document.getElementsByClassName("popup_box_container")[0].outerHTML;
        
            // Get the styles from the existing <link> elements
            var styles = `<style>${getStylesFromLinks()}</style>`;
        
            var htmlContent = "<html><head>" + styles + "</head><body>" + divContent + "</body></html>";
        
            a.download = `villagesTroops-defense-${formatDate(new Date())}.html`;
            a.href = "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);
            a.innerHTML = "[Export content]";
            document.getElementById("tribeArmiesFinder").parentNode.prepend(a);
        }
        
        createDownloadLink();
        
        

        
        if (runFinder) UI.SuccessMessage(this.UserTranslation.successMessage);

        function createArmiesSection(UserTranslation, availableSupportUnits, armies) {
            var html = `
            <table class="vis armiesSection">
                <tbody>
                    <tr>
                        <th>${UserTranslation.table.player}</th>
                        <th>Aldeia</th>
                        <th>Local</th>
                        ${loadTroopHeaders(availableSupportUnits)}
                    </tr>
            `;
            $.each(armies.armiesContent, function(username, content) {
                html += `
                <tr>
                    <td rowspan="${Object.keys(content.villages).length * 2 + 1}"><a href="/game.php?screen=info_player&id=${content.playerId}" target="_self">${username}</a></td>
                    ${Object.keys(content.villages).length > 0 ? printPlayerVillages(content.villages) : UserTranslation.errorMessageNoVillagesFound}
                </tr>`;
            });
            return html + `
            </tbody>
        </table>
        `;

            function printPlayerVillages(villages) {
                var html = '';
                $.each(villages, function(villageCoords, troops) {
                    html += `<tr><td rowspan="2"><a target="_self" href="/game.php?screen=info_village&id=${troops.inVillage['villageId']}">${troops.villageCoords}</a></td>`;
                    html += '<td>In village</td>';
                    $.each(troops.inVillage, function(troopName, troop) {
                        if (troopName === 'villageId') return;
                        html += `<td>${troop}</td>`;
                    });
                    html += '</tr><tr><td>Arriving</td>';
                    $.each(troops.onItsWay, function(troopName, troop) {
                        if (troopName === 'villageId') return;
                        html += `<td>${troop}</td>`;
                    });
                    html += `</tr>`;
                });
                return html;
            }
        }

        function loadTroopHeaders(availableSupportUnits) {
            var html = '';
            $.each(availableSupportUnits, function(key, value) {
                html += `<th>${UnitPopup.unit_data[value].shortname}</th>`;
            });
            return html;
        }

        function createStyleElement() {
            return `
            <style>
            #tribeArmiesFinder {
                margin-bottom: 18px;
            }

            #tribeArmiesFinder h2 {
                text-align: center;
            }

            #tribeArmiesFinder .searchBoxInstructions {
                font-size: 9px;
            }

            #popup_box_import table td, #popup_box_GroupsUI table td {
                background:#ecd7ac;
            }

            #tribeArmiesFinder .armiesSection {
                max-width: 700px;
                margin-top: 10px;
            }

            #tribeArmiesFinder .armiesSection .errorMessage {
                background: #f00;
                color: white;
                font-weight: bold;
            }

            #tribeArmiesFinder .btn {
                margin-top: 10px;
            }

            #tribeArmiesFinder .searchTable td {
                white-space: nowrap;
            }

            .searchCheckboxField {
                display: inline-block;
                width: 23px;
            }

            .searchCheckboxField input[type="checkbox"] {
                width: unset;
            }

            .mobile-app .searchCheckboxField input[type="checkbox"] {
                width: 17px;
                height: 17px;
                margin-left: 3px;
                vertical-align: middle;
                text-align: center;
            }
            
            #tribeArmiesFinder .searchTable .searchFieldsContainer {
                display: inline-block;
                width: calc(100% - 60px);
            }

            #tribeArmiesFinder .searchTable .searchFieldsContainer img {
                display: inline-block;
                max-width: 20px;
                vertical-align: middle;
            }

            #tribeArmiesFinder .searchTable .searchFieldsContainer div {
                display: inline-block;
            }

            #tribeArmiesFinder .searchTable input[type="number"] {
                display: inline-block;    
                width: 50px;
                color: black;
            }

            #tribeArmiesFinder .searchTable tr:last td:first {
                font-weight: bold;
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

            
            #tribeArmiesFinder .spoiler {
                max-width: 700px;
            }
            
            #tribeArmiesFinder .spoiler div {
                background: #ecd7ac;
            }

            #tribeArmiesFinder .spoiler input[type="button"] {
                white-space: normal;
                word-wrap:break-word;
            }

            #tribeArmiesFinder .searchTable .unitsContainer {
                display: inline-block;
                width: calc(100% - 31px);
            }

            #tribeArmiesFinder .searchTable .div:first {
                display: block;
            }

            .popup_box {
                opacity: 1 !important;
            }

            table {
                font-size: 9pt;
                font-family: Verdana, Arial;
            }
            </style>
            `;
        }
    }

    async #fetchTribeMembersPage() {
        var data = null;
        await $.get(this.#generateUrl('ally', 'members_troops')).done(function(data_temp) {
            data = data_temp;
        });
        return data;
    }
    
    async #handleTribeMembersPage() {
        var troopsMembersPage = await this.#fetchTribeMembersPage();
        var contentContainer = !(this.isMobile) ? 'contentContainer' : 'content_value';
        var htmlContentContainer = $(troopsMembersPage).find(`#${contentContainer}`);

        setTroopsColumnLocation(this, htmlContentContainer);
        
        
        var userIdSelectOptions = $(htmlContentContainer).find('select[name$="player_id"]').eq(0).find('option:not(:first)');
        var usersIdsArr = {};
        $.each(userIdSelectOptions, function (key, value) {
            usersIdsArr[$(value).text().trim()] = $(value).attr('value');
        });
        return usersIdsArr;

        function setTroopsColumnLocation(currentObj, htmlContentContainer) {
            $.each($(htmlContentContainer).find('table:last tr th:not(:first):not(:last)'), function(id, value) {
                var src = $(value).find('img').eq(0).attr('src');
                if (src === undefined) return;
                currentObj.troopsColumnLocation[src.substring(src.indexOf('/unit/unit_') + 11, src.indexOf('.png'))] = id + 2;
            });
        }
    }

    async #fetchTribeUserTroopsPage(userId) {
        var data = null;
        await $.get(this.#generateUrl('ally', 'members_defense', { player_id: userId })).done(function(data_temp) {
            data = data_temp;
        });
        return data;
    }

    async #handleMemberPage(userId) {
        var pageContent = await this.#fetchTribeUserTroopsPage(userId);
        var contentContainer = !(this.isMobile) ? 'contentContainer' : 'content_value';
        var troopsUserPageLines = $(pageContent).find(`#${contentContainer} table:last tr`);
        if ($(troopsUserPageLines).eq(1).find('td:eq(1)').filter(function() {return $(this).text().trim() === '?'}).length > 0) return false;

        var currentObj = this;
        var c = -1;
        var villageCoord = '';
        var villageReturnObj = [];
        $.each(troopsUserPageLines.slice(1), function (key, value) {
            var villageTroops = {};
            $.each(currentObj.availableSupportUnits, function(key2, value2) {
                villageTroops[value2] = $(value).find('td').eq(currentObj.troopsColumnLocation[value2] - (c % 2 === 0 ? 1 : 0)).text().trim();
            });
            villageTroops['villageId'] = (new URLSearchParams($(value).find('td a').attr('href'))).get('id');
            c++;
            if (c % 2 === 0) {
                villageCoord = /\d{3}\|\d{3}/.exec($(value).find('td a').eq(0).text())[0];

                villageReturnObj.push({
                    villageCoords: villageCoord,
                    inVillage: villageTroops,
                    onItsWay: {}
                });
            } else {
                villageReturnObj[~~(c / 2)].onItsWay = villageTroops;
            }
        });
        return villageReturnObj;
    }

    async #getTribeArmies() {
        var armies = {
            armiesContent: {}
        };
        var lastRunTime = 0;

        var users = await this.#handleTribeMembersPage();
        Dialog.close();
        Dialog.show('import', `<h2 id="tribeArmiesLoading" style="color:green;">${this.UserTranslation.loadingMessage}</h2><div id="tribeTroopsExporterLoadingBar" class="progress-bar live-progress-bar"><div style="background: rgb(146, 194, 0);"></div><span class="label" style="margin-top:0px;"></span></div>`, Dialog.close());
        UI.InitProgressBars()
        UI.updateProgressBar($('#tribeTroopsExporterLoadingBar'), 0, Object.keys(users).length);
        lastRunTime = Date.now();
        var currentObj = this;
        var c = 0;
        for(var username in users)
        {
            var userId = users[username];
            await new Promise(res => setTimeout(res, Math.max(lastRunTime + 200 - Date.now(), 0))); 
            lastRunTime = Date.now();
            var userTroops = await currentObj.#handleMemberPage(userId);
            armies.armiesContent[username] = {
                villages: userTroops,
                playerId: userId
            };

            UI.updateProgressBar($('#tribeTroopsExporterLoadingBar'), c + 1, Object.keys(users).length);
            $('#tribeArmiesLoading').text(this.UserTranslation.loadingMessage + '...'.substring(0, (c + 1) % 4));
            c++;
        };
        return armies;
    }
}

var tribeTroopsExporter = new TribeTroopsExporter();
}