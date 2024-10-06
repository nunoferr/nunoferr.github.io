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

 if (typeof incomingTribeAttacksDisplay !== 'undefined') {
    incomingTribeAttacksDisplay.init();
 } else {
 class AttackTribeCalculator {
    static AttackTribeCalculatorTranslations() {
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
        this.UserTranslation = game_data.locale in AttackTribeCalculator.AttackTribeCalculatorTranslations() ? this.UserTranslation = AttackTribeCalculator.AttackTribeCalculatorTranslations()[game_data.locale] : IncomingTribeAttacksDisplay.IncomingTribeAttacksDisplayTranslations().en_US;
        // this.UserTranslation = AttackTribeCalculator.AttackTribeCalculatorTranslations().en_US;
        this.availableSupportUnits = Object.create(game_data.units);
        this.availableSupportUnits.splice(this.availableSupportUnits.indexOf('militia'), 1);
        this.troopsColumnLocation = {};
        this.versionNumber = game_data.version.substring(0, game_data.version.indexOf(' '));
        this.isMobile = $('#mobileHeader').length > 0;
        UnitPopup.whenDataReady(function() { attackTribeCalculator.init() }); // fetch units data for units automatic translations
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
        var unitsFormValues = this.#initFormValues();
        var armiesSection = '';

        if (runFinder) {
            unitsFormValues = this.#fetchUnitsFormValues(unitsFormValues);
            armiesSection = createArmiesSection(this.UserTranslation, await this.#getTribeArmies(unitsFormValues));
        }

        var html = `
        <div id="tribeArmiesFinder" class="${this.isMobile ? 'mobile-app' : ''}">
            <form onsubmit="attackTribeCalculator.calculate(event);">
                <h2>${this.UserTranslation.title}</h2>

                <p>${this.UserTranslation.instructions}</p>
                <p class="searchBoxInstructions">${this.UserTranslation.searchBoxExpandInstruictions}</p>
                
                ${this.#createSearchTable(unitsFormValues)}

                <input type="submit" class="btn btn-default" value="${this.UserTranslation.findButton}">
                
                ${this.#createGroupsSection()}
                ${armiesSection}
                ${createStyleElement()}
            </form>
        </div>
        <div class="creditsSection">${this.UserTranslation.credits}</div>
        `;
        Dialog.show('import', html, Dialog.close());

        $('#popup_box_import').css('width', 'unset');
        setTimeout(() => {
            $('#tribeArmiesFinder .searchTable').css('width', '+=18px');
        }, 300);
        
        if (runFinder) UI.SuccessMessage(this.UserTranslation.successMessage);

        function createArmiesSection(UserTranslation, armies) {
            var html = `
            <table class="vis armiesSection">
                <tbody>
                    <tr>
                        <th>${UserTranslation.table.player}</th>
                        <th>${UserTranslation.table.villages}</th>
                    </tr>
            `;
            $.each(armies.armiesContent, function(username, content) {
                html += `
                <tr>
                    <td><a href="/game.php?screen=info_player&id=${content.playerId}" target="_self">${username}</a></td>
                    <td class="${Object.keys(content.villages).length === 0 ? 'errorMessage' : ''}">${Object.keys(content.villages).length > 0 ? printPlayerVillages(content.villages) : UserTranslation.errorMessageNoVillagesFound}</td>
                </tr>`;
            });
            return html + `
                <tr>
                    <td>${UserTranslation.table.total}</td>
                    <td>${armies.armiesCount}</td>
                </tr>
            </tbody>
        </table>
        ${createVillageCoordsSpoiler(armies.armiesContent, UserTranslation.coordinatesToImport)}`;

            function printPlayerVillages(villages) {
                var html = '';
                $.each(villages, function(villageId, villageCoords) {
                    html += `<a target="_self" href="/game.php?screen=info_village&id=${villageId}">${villageCoords}</a> `;
                });
                return html;
            }
        }

        function createVillageCoordsSpoiler(content, coordinatesToImport) {
            var villagesHtml = '';
            $.each(content, function(id, cont) {
                $.each(cont.villages, function(villageId, villageCoords) {
                    villagesHtml += villageCoords + ' ';
                });
            });
            return `
            <div class="spoiler">
                <input type="button" class="btn" value="${coordinatesToImport}" onclick="toggle_spoiler(this)">
                <div>
                    <span style="display:none">${villagesHtml}</span>
                </div>
            </div>
            `;
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
            </style>
            `;
        }
    }

    #initFormValues() {
        var formValues = {};
        $.each(this.availableSupportUnits, function(key, value) {
            formValues[value] = {
                'bigger': NaN,
                'smaller': NaN
            };
        });
        return formValues;
    }

    #fetchUnitsFormValues(unitsFormValues) {
        $.each(this.availableSupportUnits, function(key, value) {
            unitsFormValues[value] = {
                'bigger': parseInt($(`#tribeArmiesFinder-bigger-${value}`).val()) || 0,
                'smaller': parseInt($(`#tribeArmiesFinder-smaller-${value}`).val())
            };
        });
        return unitsFormValues;
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
                currentObj.troopsColumnLocation[src.substring(src.indexOf('/unit/unit_') + 11, src.indexOf('.png'))] = id + 1;
            });
        }
    }

    async #fetchTribeUserTroopsPage(userId) {
        var data = null;
        await $.get(this.#generateUrl('ally', 'members_troops', { player_id: userId })).done(function(data_temp) {
            data = data_temp;
        });
        return data;
    }

    async #handleMemberPage(userId) {
        var pageContent = await this.#fetchTribeUserTroopsPage(userId);
        var contentContainer = !(this.isMobile) ? 'contentContainer' : 'content_value';
        var troopsUserPageLines = $(pageContent).find(`#${contentContainer} table:last tr`);
        if ($(troopsUserPageLines).eq(1).find('td:eq(1)').filter(function() {return $(this).text().trim() === '?'}).length > 0) return false;

        var userTroopsList = {};
        var currentObj = this;
        $.each(troopsUserPageLines.slice(1), function (key, value) {
            var villageTroops = {};
            $.each(currentObj.availableSupportUnits, function(key2, value2) {
                villageTroops[value2] = $(value).find('td').eq(currentObj.troopsColumnLocation[value2]).text().trim();
            });
            villageTroops['villageId'] = (new URLSearchParams($(value).find('td a').attr('href'))).get('id');
            userTroopsList[/\d{3}\|\d{3}/.exec($(value).find('td a').eq(0).text())[0]] = villageTroops;
        });
        return userTroopsList;
    }

    async #getTribeArmies(unitsFormValues) {
        var armies = {
            armiesCount: 0,
            armiesContent: {
                // playerId: '',
                // villages: {}
            }
        };
        var lastRunTime = 0;

        var users = await this.#handleTribeMembersPage();
        Dialog.close();
        Dialog.show('import', `<h2 id="tribeArmiesLoading" style="color:green;">${this.UserTranslation.loadingMessage}</h2><div id="attackTribeCalculatorLoadingBar" class="progress-bar live-progress-bar"><div style="background: rgb(146, 194, 0);"></div><span class="label" style="margin-top:0px;"></span></div>`, Dialog.close());
        UI.InitProgressBars()
        UI.updateProgressBar($('#attackTribeCalculatorLoadingBar'), 0, Object.keys(users).length);
        lastRunTime = Date.now();
        var currentObj = this;
        var availableSupportUnits = this.availableSupportUnits;
        var c = 0;
        for(var username in users)
        {
            var userId = users[username];
            await new Promise(res => setTimeout(res, Math.max(lastRunTime + 200 - Date.now(), 0))); 
            lastRunTime = Date.now();
            var userTroops = await currentObj.#handleMemberPage(userId);
            var playerVillages = {};

            $.each(userTroops, function(villageCoords, villageTroops) { // If userTroops is false, foreach is automatically skipped
                var villageMatchesCriteria = true;
                $.each(availableSupportUnits, function(index, unit) {
                    if (!isNaN(unitsFormValues[unit]['bigger']) && villageTroops[unit] < unitsFormValues[unit]['bigger']) villageMatchesCriteria = false;
                    if (!isNaN(unitsFormValues[unit]['smaller']) && villageTroops[unit] > unitsFormValues[unit]['smaller']) villageMatchesCriteria = false;
                });

                if (villageMatchesCriteria) {
                    armies.armiesCount++;
                    playerVillages[villageTroops['villageId']] = villageCoords;
                }
            });
            
            if (Object.keys(playerVillages).length > 0 || userTroops === false) {
                armies.armiesContent[username] = {
                    villages: playerVillages,
                    playerId: userId
                };
            }

            UI.updateProgressBar($('#attackTribeCalculatorLoadingBar'), c + 1, Object.keys(users).length);
            $('#tribeArmiesLoading').text(this.UserTranslation.loadingMessage + '...'.substring(0, (c + 1) % 4));
            c++;
        };
        return armies;
    }

    #createSearchTable(unitsFormValues) {
        return `
        <table class="vis searchTable">
            <tbody>
                ${fillSearchFields(this.availableSupportUnits, this.versionNumber, this.isMobile, unitsFormValues)}
            </tbody>
        </table>
        <div style="clear: both;"></div>
        `;
        
        function fillSearchFields(availableSupportUnits, versionNumber, isMobile, unitsFormValues) {
            var maxColumnLength = !isMobile ? availableSupportUnits.length / 2 : 2
            var fieldsList = `
                <tr>
                    <th colspan="${maxColumnLength}">Units</th>
                </tr>
            `;
            
            var fieldsLine = '';
            $.each(availableSupportUnits, function(key, value) {
                fieldsLine += `
                <td>
                    <div class="searchCheckboxField">
                        <input type="checkbox" style="vertical-align:${!isNaN(unitsFormValues[value]['smaller']) ? '8px' : !isMobile ? 'baseline' : 'middle'};${this.isMobile ? 'width: 13px;height: 13px;' : ''}" ${!isNaN(unitsFormValues[value]['smaller']) ? 'checked' : ''} onclick="attackTribeCalculator.changeCheckedStatus(this);">
                    </div>
                    <div class="unitsContainer">
                        <div>
                            <div class="searchFieldsContainer">
                                <img src="https://dspt.innogamescdn.com/asset/${versionNumber}/graphic/unit/recruit/${value}.png" alt="" class="">
                                <div>${UnitPopup.unit_data[value].shortname} ≥</div>
                            </div>
                            <input type="number" id="tribeArmiesFinder-bigger-${value}" min="0" step="1" value="${unitsFormValues[value]['bigger'] || 0}">
                        </div>
                        <div class="tribeVillagesArmiesSmallerThan" style="display:${!isNaN(unitsFormValues[value]['smaller']) ? 'block' : 'none'};">
                            <div class="searchFieldsContainer">
                                <img src="https://dspt.innogamescdn.com/asset/${versionNumber}/graphic/unit/recruit/${value}.png" alt="" class="">
                                <div>${UnitPopup.unit_data[value].shortname} ≤</div>
                            </div>
                            <input type="number" id="tribeArmiesFinder-smaller-${value}" min="0" step="1" value="${unitsFormValues[value]['smaller']}">
                        </div>
                    </div>
                </td>`;
                if ((key !== 0 && (key + 1) % maxColumnLength === 0) || key === availableSupportUnits.length - 1) {
                    fieldsList += `<tr>${fieldsLine}</tr>`;
                    fieldsLine = '';
                }
            });
            return fieldsList;
        }
    }

    async calculate(event) {
        event.preventDefault();
        this.#createUI(true);
    }

    changeCheckedStatus(checkbox) {
        var smallerThanSec = $(checkbox).parent().parent().find('.tribeVillagesArmiesSmallerThan');
        $(smallerThanSec).css('display', smallerThanSec.css('display') === 'none' ? 'block' : 'none');
        $(checkbox).css('vertical-align', smallerThanSec.css('display') === 'block' ? '8px' : !this.isMobile ? 'baseline' : 'middle');
        if (!$(checkbox).attr('checked')) $(smallerThanSec).find('input').val(null);
    }

    
    #getStoredArmiesGroups() {
        var tribeArmiesGroups = {};
        var storageVal = localStorage.getItem('tribeArmiesGroups');
        if (storageVal !== null) tribeArmiesGroups = JSON.parse(storageVal);
        return tribeArmiesGroups;
    }
    
    #storeStoredArmiesGroups(tribeArmiesGroups) {
        localStorage.setItem('tribeArmiesGroups', JSON.stringify(tribeArmiesGroups));
    }

    #createGroupsSection() {
        return `
        <div id="groupsSection" style="border: 1px solid #7d510f;display: block;width: 291px;margin-top:10px;padding:5px;background: transparent url(https://dspt.innogamescdn.com/asset/86f7f6ca/graphic/index/iconbar-mc.png) scroll left top repeat;">
            <h3 style="margin: 0;line-height: 1;padding: 0;">Groups</h3>
            <h4 style="margin: 15px 0 0 0;line-height: 1;padding: 0;">Create new group</h4>
            <span style="font-size: 9px;font-style: italic;">(or fill with a new name if renaming a current group)</span></br>
            <input type="text" id="newGroupName" placeholder="New group name">
            <input type="button" style="margin-top: 10px;" class="btn evt-confirm-btn btn-confirm-yes" value="Create group with current troops" onclick="attackTribeCalculator.createNewGroup()">
            <h4 style="margin: 15px 0 5px 0;line-height: 1;padding: 0;">Select group</h4>
            ${initEditGroupsSection(this.#getStoredArmiesGroups())}
            </br>
            <input type="button" class="btn btn-default" style="background: #4040f7;" value="Edit group with current troops" onclick="attackTribeCalculator.editGroup()">
            <input type="button" class="btn btn-default" value="Delete group" onclick="attackTribeCalculator.deleteGroup()">
        </div>
        `;

        function initEditGroupsSection(tribeArmiesGroups) {
            var html = '<option selected default="true">No group selected</option>';
            $.each(tribeArmiesGroups, function(key, value) {
                html += `<option value="${key}">${key}</option>`;
            });
            html = `<select id="tribeArmiesGroupsSelect" style="width: 135px;" onchange="attackTribeCalculator.fillArmies()">${html}</select>`;
            return html;
        }
    }

    fillArmies() {
        var selected = $('#tribeArmiesFinder #groupsSection #tribeArmiesGroupsSelect').find(":selected");

        if ($(selected).attr('default') === 'true') {
            fillForm(this.#initFormValues());
            return;
        } 
        
        fillForm(this.#getStoredArmiesGroups()[$(selected).val()]);
        UI.InfoMessage('Group loaded.');
        
        function fillForm(formValues) {
            $.each(formValues, function(key, value) {
                var smallerFieled = $(`#tribeArmiesFinder-smaller-${key}`);
                $(`#tribeArmiesFinder-bigger-${key}`).val(value.bigger);
                smallerFieled.val(value.smaller);

                var checkbox = smallerFieled.parent().parent().parent().find('.searchCheckboxField input');
                if (value.smaller !== null) {
                    smallerFieled.parent().css('display', 'block'); 
                    $(checkbox).css('vertical-align', '8px');
                    $(checkbox).attr('checked', 'true');
                } else {
                    smallerFieled.parent().css('display', 'none');
                    $(checkbox).css('vertical-align', !this.isMobile ? 'baseline' : 'middle');
                    $(checkbox).removeAttr('checked');
                }
            });
        }
    }

    createNewGroup(updatingGroup = false) {
        var newGroupName = $('#tribeArmiesFinder #groupsSection #newGroupName').val().trim();
        if ((newGroupName.length === 0 || newGroupName === 'No group selected')) {
            UI.ErrorMessage('Please give the group a name');
            return;
        }

        var tribeArmiesGroups = this.#getStoredArmiesGroups();
        if (tribeArmiesGroups.hasOwnProperty(newGroupName)) {
            UI.ErrorMessage('A group with this name already exists, please choose a different name.');
            return;
        }
        
        tribeArmiesGroups[newGroupName.trim()] = this.#fetchUnitsFormValues(this.#initFormValues());
        this.#storeStoredArmiesGroups(tribeArmiesGroups);
        UI.SuccessMessage(!updatingGroup ? 'Group successfully created.' : 'Group successfully edited!');
        this.#createUI();
    }

    editGroup() {
        var selected = $('#tribeArmiesFinder #groupsSection #tribeArmiesGroupsSelect').find(":selected");

        if ($(selected).attr('default') === 'true') {
            UI.ErrorMessage('Please select a group to edit.');
            return;
        }

        var tribeArmiesGroups = this.#getStoredArmiesGroups();

        var newName = $('#tribeArmiesFinder #groupsSection #newGroupName').val();
        var groupNameChange = false;
        if (newName.trim().length > 0 && selected.val().trim() !== newName) { // name is changing
            if (tribeArmiesGroups.hasOwnProperty(newName)) {
                UI.ErrorMessage('A group with this name already exists, please choose a different name.');
                return;
            }
            groupNameChange = true;
        } else {
            $('#tribeArmiesFinder #groupsSection #newGroupName').val(selected.val().trim());
        }

        var currentObj = this;
        UI.addConfirmBox(`Are you sure that you want to edit the <strong>${$(selected).val()}</strong> group?
        ${!groupNameChange ? '' : `</br>Keep in mind the group name will be changed to <strong>${newName}</strong>`}`, function() {
            currentObj.deleteGroup(true);
            currentObj.createNewGroup(true);
        });
    }

    deleteGroup(bypassConfirmationBox = false) {
        var selected = $('#tribeArmiesFinder #groupsSection #tribeArmiesGroupsSelect').find(":selected");
        var currentObj = this;
        if ($(selected).attr('default') === 'true') {
            UI.ErrorMessage('Please select a group to delete.');
            return;
        }
        if (!bypassConfirmationBox) {
            UI.addConfirmBox(`Are you sure that you want to delete the ${$(selected).val()} group?`, deleteGroupById);
        } else {
            deleteGroupById(null);
        }

        function deleteGroupById(e) {
            var tribeArmiesGroups = currentObj.#getStoredArmiesGroups();
            delete tribeArmiesGroups[$(selected).val()];
            currentObj.#storeStoredArmiesGroups(tribeArmiesGroups);
            if (!bypassConfirmationBox) {
                UI.SuccessMessage('Group successfully deleted.');
                currentObj.#createUI();
            }
        }
    }
}

var attackTribeCalculator = new AttackTribeCalculator();
}