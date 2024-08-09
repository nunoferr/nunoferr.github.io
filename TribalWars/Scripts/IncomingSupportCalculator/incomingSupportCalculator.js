/*
* Script Name: Incoming Support Calculator
* Version: v1.0
* Last Updated: 2024-08-08
* Author: NunoF-
* Author URL: https://nunoferr.github.io/
* Author Contact: Discord - ducks4ever#quack
* Special Thanks to: - Pinus O.o for coming up with the script idea
* Approved: Not yet
* Approved Date: None yet
* Mod: Non yet
*/

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

class IncomingSupportCalculator {
    static IncomingSupportCalculatorTranslations() {
        return {
            en_US: {
                supportSection: {
                    widgetTitle: 'IncomingSupport',
                    buttonCalculate: 'Calculate Available Support',
                    buttonSimulate: 'Simulate defense',
                    incoming: 'Incoming',
                    willBeInVillage: 'Will be in the village',
                    arrival: 'Arrival',
                    arrivingIn: 'Arriving in',
                    incomingSupport: 'Incoming support',
                    instructions1: 'Select a checkbox on the new "Support" column and wait for the script to load.',
                    instructions2: 'Optionally, select a date and click on the button'
                },
                checkboxesTitle: 'Support',
                errorNotOverviewScreen: 'This script can only be run from the Overview screen.'
            },
            pt_PT: {
                supportSection: {
                    widgetTitle: 'Apoio a caminho',
                    buttonCalculate: 'Calcular Apoio Disponível',
                    buttonSimulate: 'Simular defesa',
                    incoming: 'A chegar',
                    willBeInVillage: 'Vai estar na aldeia em',
                    arrival: 'Chegada',
                    arrivingIn: 'Chega em',
                    incomingSupport: 'Apoio a chegar',
                    instructions1: 'Selecione uma checkbox na nova coluna de "Suporte" e espere que o script carregue.',
                    instructions2: 'Opcionalmente, selecione uma data e clique no botão'
                },
                checkboxesTitle: 'Suporte',
                errorNotOverviewScreen: 'Este script apenas pode ser corrido pela página principal da aldeia.'
            }
        };
    }

    constructor() {
        this.UserTranslation = game_data.locale in IncomingSupportCalculator.IncomingSupportCalculatorTranslations() ? this.UserTranslation = IncomingSupportCalculator.IncomingSupportCalculatorTranslations()[game_data.locale] : IncomingSupportCalculator.IncomingSupportCalculatorTranslations().en_US;
        this.incomingSupportData = [];
        this.availableSupportUnits = Object.create(game_data.units);
        this.availableSupportUnits.splice(this.availableSupportUnits.indexOf('militia'), 1);
        this.progressBarLoading = false;
        this.supportSectionActive = false
    }

    async init() {
        if (!this.#isOnOverviewScreen()) {
            UI.ErrorMessage(this.UserTranslation.errorNotOverviewScreen);
            return;
        }
        this.#createUI();
    }

    #isOnOverviewScreen() {
        return game_data.screen === 'overview';
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
    
    #generateCheckboxes() {
        var incomingAttacksDiv = $('#commands_incomings');
        var incomingAttackTh = $(incomingAttacksDiv).find('tr').eq(0);
        $(incomingAttackTh).prepend('<th>' + this.UserTranslation.checkboxesTitle + '</th>');
        $(incomingAttacksDiv).find('.command-row').each(function(i, obj) {
            $(obj).prepend('<td><input type="checkbox" class="incomingAttackSupportCkb" value="this" onclick="incomingSupportCalculator.clearOtherIncomingSupportCheckboxes(this)"></td>');
        });
    }

    async clearOtherIncomingSupportCheckboxes(checkboxObj) {
        this.supportSectionActive = false;
        checkboxObj = $(checkboxObj);
        $('.incomingAttackSupportCkb').each(function() {
            if (!$(this).is(checkboxObj)) {
                $(this).prop("checked", false);
            }
        });
        this.calculateAvailableSupport();
    }

    #createUI() {
        this.#generateCheckboxes();
        var html = `
        <div id="show_incoming_support" class="vis moveable widget commands-container-outer" style="opacity: 1;background: #f4e4bc;">
        <h4 class="head with-button ui-sortable-handle">
            <img class="widget-button" onclick="return VillageOverview.toggleWidget( 'show_incoming_support', this );" src="graphic/minus.png">${this.UserTranslation.supportSection.widgetTitle}
        </h4>
        <div class="widget_content" style="display: block;">
            <div id="commands_incomings" class="commands-container">
                <div style="padding: 10px 10px 15px 10px">
                    <p>${this.UserTranslation.supportSection.instructions1}.</p>
                    <p>${this.UserTranslation.supportSection.instructions2}.</p>
                    <input type="date" id="incoming-support-date" class="btn"/>
                    <input type="time" id="incoming-support-time" class="btn" step="1">:
                    <input type="number" id="incoming-support-ms" class="btn" min="0" max="999" step="1" placeholder="000"/>
                    <br><br>
                    <input type="button" class="btn" onclick="incomingSupportCalculator.switchToInputDate();" value="${this.UserTranslation.supportSection.buttonCalculate}"/>
                </div>
                <div id="IncomingSupportLoadingBarContainer"></div>
                <table class="vis" id="incomingSupportTable" style="width:100%">
                    <tbody>
                    <tr>
                        <th>
                            ${this.UserTranslation.supportSection.incoming}
                        </th>
                        <th>${this.UserTranslation.supportSection.arrival}</th>
                        <th>${this.UserTranslation.supportSection.arrivingIn}:</th>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
        </div>`;
        $('#show_incoming_units').before(html);
        
        var objectDate = new Date();
        $('#incoming-support-date').val(objectDate.toLocaleDateString('sv'));
        $('#incoming-support-time').val(objectDate.toTimeString().slice(0, 8));
        $('#incoming-support-ms').val('000');
       

        var troopsTableHtml = `
<div style="clear:both">
   <h4 style="position:relative;">${this.UserTranslation.supportSection.incomingSupport}</h4>
   <table id="support_units_sum" class="vis overview_table" width="100%" style="background: #edd8ad;">
      <thead>
         <tr>
            <th style="text-align:center" width="35"></th>
            <th style="text-align:center" width="35"><a href="#" class="unit_link" data-unit="spear"><img src="https://dspt.innogamescdn.com/asset/4f05e65d/graphic/unit/unit_spear.png" class="" data-title="Lanceiro"></a></th>
            <th style="text-align:center" width="35"><a href="#" class="unit_link" data-unit="sword"><img src="https://dspt.innogamescdn.com/asset/4f05e65d/graphic/unit/unit_sword.png" class="" data-title="Espadachim"></a></th>
            <th style="text-align:center" width="35"><a href="#" class="unit_link" data-unit="axe"><img src="https://dspt.innogamescdn.com/asset/4f05e65d/graphic/unit/unit_axe.png" class="" data-title="Viking"></a></th>
            <th style="text-align:center" width="35"><a href="#" class="unit_link" data-unit="spy"><img src="https://dspt.innogamescdn.com/asset/4f05e65d/graphic/unit/unit_spy.png" class="" data-title="Batedor"></a></th>
            <th style="text-align:center" width="35"><a href="#" class="unit_link" data-unit="light"><img src="https://dspt.innogamescdn.com/asset/4f05e65d/graphic/unit/unit_light.png" class="" data-title="Cavalaria leve"></a></th>
            <th style="text-align:center" width="35"><a href="#" class="unit_link" data-unit="heavy"><img src="https://dspt.innogamescdn.com/asset/4f05e65d/graphic/unit/unit_heavy.png" class="" data-title="Cavalaria Pesada"></a></th>
            <th style="text-align:center" width="35"><a href="#" class="unit_link" data-unit="ram"><img src="https://dspt.innogamescdn.com/asset/4f05e65d/graphic/unit/unit_ram.png" class="" data-title="Aríete"></a></th>
            <th style="text-align:center" width="35"><a href="#" class="unit_link" data-unit="catapult"><img src="https://dspt.innogamescdn.com/asset/4f05e65d/graphic/unit/unit_catapult.png" class="" data-title="Catapulta"></a></th>
            <th style="text-align:center" width="35"><a href="#" class="unit_link" data-unit="knight"><img src="https://dspt.innogamescdn.com/asset/4f05e65d/graphic/unit/unit_knight.png" class="" data-title="Paladino"></a></th>
            <th class="center" style="width: 35px" data-title="População"><span class="icon header population"></span></th>
         </tr>
      </thead>
      <tbody>
      </tbody>
   </table>
   <div></div>
</div>`;
        $(incomingSupportTable).before(troopsTableHtml);
    }

    #getFinalTimestamp() {
        var selectedCheckbox = $('#commands_incomings table .command-row .incomingAttackSupportCkb').filter(function() { return $(this).is(":checked")} );
        return parseInt(selectedCheckbox.parent().parent().find('span').filter(function() {
            return $(this).attr('data-endtime') !== undefined;
        }).attr('data-endtime') + $(selectedCheckbox).parent().parent().find('.small').text());
    }
    
    async switchToInputDate() {
        this.clearOtherIncomingSupportCheckboxes(null);
        var timestamp = parseInt(Date.parse($('#incoming-support-date').val() + 'T' + $('#incoming-support-time').val() + '.' + $('#incoming-support-ms').val()).toString());
        this.calculateAvailableSupport(timestamp);
    }

    async calculateAvailableSupport(finalTimestamp = null) {
        if (finalTimestamp === null) finalTimestamp = this.#getFinalTimestamp();
        if (isNaN(finalTimestamp)) return;

        var data = null;
        await $.get(this.#generateUrl('place', 'command')).done(function(data_temp) {
            data = data_temp;
        });

        this.setIncomingSupportData(data, finalTimestamp);
        await this.setIncomingTroops();
    }

    async setIncomingTroops() {
        if (!(this.incomingSupportData.length > 0)) return;
        var sessionStorageSavedTroops = sessionStorage.getItem('incominSupportCounterTroops') !== null ? JSON.parse(sessionStorage.getItem('incominSupportCounterTroops')) : {};
        this.progressBarLoading = true;
        $('#IncomingSupportLoadingBarContainer').html('<div id="IncomingSupportLoadingBar" class="progress-bar live-progress-bar"><div style="background: rgb(146, 194, 0);"></div><span class="label" style="margin-top:0px;"></span></div>');
        UI.InitProgressBars()
        UI.updateProgressBar($('#IncomingSupportLoadingBar'), 0, this.incomingSupportData.length);

        this.runNext(this, sessionStorageSavedTroops, 0, this.incomingSupportData, 0);
    }

    async runNext(currentObj, sessionStorageSavedTroops, lastRunTime, incomingSupportData, c) {
        var currentObj = this;
        if(sessionStorageSavedTroops[incomingSupportData[c].commandId] !== undefined) {
            getSavedTroops(currentObj, sessionStorageSavedTroops, incomingSupportData, c);
        } else {
            fetchTroops(currentObj, sessionStorageSavedTroops, lastRunTime, incomingSupportData, c)
        }


        async function getSavedTroops(currentObj, sessionStorageSavedTroops, incomingSupportData, c) {
            incomingSupportData[c]['units'] = sessionStorageSavedTroops[incomingSupportData[c].commandId];
            // Exit condition
            if (readyToExit(currentObj, c, incomingSupportData.length, sessionStorageSavedTroops)) return;
           
            currentObj.runNext(currentObj, sessionStorageSavedTroops, 0, incomingSupportData, ++c);
        }

        async function fetchTroops(currentObj, sessionStorageSavedTroops, lastRunTime, incomingSupportData, c) {
            var url = currentObj.#generateUrl('info_command', null, { 'ajax': 'details', 'id': incomingSupportData[c].commandId });
            await new Promise(res => setTimeout(res, Math.max(lastRunTime + 200 - Date.now(), 0))); 
            $.get(url).done(function(data) {
                incomingSupportData[c]['units'] = data.units;
                sessionStorageSavedTroops[incomingSupportData[c].commandId] = data.units;
                // Exit condition
                if (readyToExit(currentObj, c, incomingSupportData.length, sessionStorageSavedTroops)) return;
                
                currentObj.runNext(currentObj, sessionStorageSavedTroops, Date.now(), incomingSupportData, ++c);
            });
        }

        function readyToExit(currentObj, c, cSize) {
            UI.updateProgressBar($('#IncomingSupportLoadingBar'), c + 1, incomingSupportData.length); 
            if (c === cSize - 1) {
                currentObj.progressBarLoading = false;
                currentObj.supportSectionActive = true;
                sessionStorage.setItem('incominSupportCounterTroops', JSON.stringify(sessionStorageSavedTroops));
                return true;
            }
            return false;
        }
    }

    setIncomingSupportData(data, finalTimestamp) {
        var incomingSupportTr = findIncomingSupportByTimestamp(data, finalTimestamp);
        var incomingSupportData = [];
        incomingSupportTr.each(function() {
            var currentLine = $(this).find('td');
            incomingSupportData.push({
                'commandId': $(currentLine).find('.quickedit').attr('data-id'),
                'incoming': $(currentLine).filter(function() { return $(this).find('.quickedit-label').length > 0; }),
                'arrival': $(currentLine).filter(function() { return $(this).find('.small').length > 0; }).html(),
                'arrivingIn': $(currentLine).find('span').filter(function() { return $(this).filter(function() { return $(this).attr('data-endtime') !== undefined; }).length > 0; }).attr('data-endtime')
            });
        });
        this.incomingSupportData = incomingSupportData;

        function findIncomingSupportByTimestamp(data, timestamp) {
            return $(data).find('#commands_incomings tr').filter(function() {
                return $(this).find('span').filter(function() {
                    return $(this).attr('data-command-type') === 'support';
                }).length > 0 && $(this).find('span').filter(function() {
                    return parseInt(($(this).attr('data-endtime') + $(this).parent().parent().find('.small').text())) < timestamp;
                }).length > 0;
            });
        } 
    }

    fillSupportTable() {
        // Clear tables
        $('#incomingSupportTable tr:gt(0)').remove();
        $('#support_units_sum tr:gt(0)').remove();

        if (!this.supportSectionActive && !this.progressBarLoading) {
            $('#IncomingSupportLoadingBar').remove();
        }
        
        if (!this.supportSectionActive) return;
        
        this.incomingSupportData.forEach(function(incomingSupport) {
            $(incomingSupport.incoming).find('.rename-icon').remove();
            $('#incomingSupportTable tbody tr').last().after(`
                <tr>
                    <td>${$(incomingSupport.incoming).html()}</td>
                    <td>${incomingSupport.arrival}</td>
                    <td>${getFormattedArrivalTime(incomingSupport.arrivingIn)}</td>
                </tr>
            `);
        });

        fillIncomingSupportTable(this.#getCurrentSupportTroops(), this.#getCurrentVillageAndSupportTroops(), this.UserTranslation);

        function getFormattedArrivalTime(timestamp) {
            var dateValue = new Date(getArrivalTime(timestamp));
            return ('0' + dateValue.getHours()).slice(-2) + ':' + ('0' + dateValue.getMinutes()).slice(-2) + ':' + ('0' + dateValue.getSeconds()).slice(-2);

            function getArrivalTime(timestamp) {
                return getIncomingSupportTime(timestamp) - getServerTime() - 3600000;
            }
            
            function fixDateOffset(dateTime) {
                return new Date((dateTime.getTime() + (dateTime.getTimezoneOffset() * 60000)) + server_utc_diff * 1000);
            };
    
            function getServerTime() {
                var times = $('#serverDate').text().split('/');
                return fixDateOffset(new Date(times[2] + '-' + times[1] + '-' + times[0] + ' ' + $('#serverTime').text()));
            }
    
            function getIncomingSupportTime(timestamp) {
                return new Date(timestamp * 1000);
            }
        }

        function fillIncomingSupportTable(troops, currentVillageAndSupportTroops, UserTranslation) {
            var troopsHtml = '<tr>';
            troopsHtml += `<td class="center" data-unit="${troop}">${UserTranslation.supportSection.incoming}</td>`;
            for (var troop in troops) {
                troopsHtml += `<td class="center" data-unit="${troop}">${troops[troop]}</td>`;
            };
            troopsHtml += '</tr>';
            $('#support_units_sum tbody').last().append(troopsHtml);

            var willBeInVillageHtml = '<tr>';
            willBeInVillageHtml += `<td class="center" data-unit="${troop}">${UserTranslation.supportSection.willBeInVillage}</td>`;
            for (var troop in currentVillageAndSupportTroops) {
                willBeInVillageHtml += `<td class="center" data-unit="${troop}">${currentVillageAndSupportTroops[troop]}</td>`;
            };
            willBeInVillageHtml += '</tr>';
            $('#support_units_sum tbody').last().append(willBeInVillageHtml);

            var htmlBtn = `<tr><td colspan="11"><input type="button" class="btn" onclick="incomingSupportCalculator.openSimulator();" value="${UserTranslation.supportSection.buttonSimulate}"/></td></tr>`;
            $('#support_units_sum tbody').last().append(htmlBtn);
        }
    }

    #getCurrentVillageAndSupportTroops() {
        var troops = this.#getCurrentSupportTroops();
        for (var troop in troops) {
            troops[troop] = parseInt($('#unit_overview_table .all_unit td strong').filter(function() { return $(this).attr('data-count') === troop; }).text() || 0) + parseInt(troops[troop]);
        };
        return troops;
    }

    #getCurrentSupportTroops() {
        var troops = this.#initTroops();
        this.incomingSupportData.forEach((incomingSupport) => {
            this.availableSupportUnits.forEach((unit) => {
                troops[unit] += parseInt(incomingSupport.units[unit].count);
            });
        });
        return troops;
    }

    #initTroops() {
        var troops = {};
        this.availableSupportUnits.forEach(function(unit) {
            troops[unit] = 0;
        });
        return troops;
    }

    openSimulator() {
        var troops = this.#getCurrentVillageAndSupportTroops();
        var form = document.createElement("form");
        form.method = "POST";
        form.action = this.#generateUrl('place', 'sim');
        form.target = "_blank";

        troops['wall'] = game_data.village.buildings.wall;
        $.each(troops, function (key, value) {
            var input = document.createElement("input");
            input.type = 'hidden';
            input.name = `def_${key}`;
            input.value = value
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    }
}

var incomingSupportCalculator = new IncomingSupportCalculator();
incomingSupportCalculator.init();
$(window.TribalWars).on('global_tick', function () {
    incomingSupportCalculator.fillSupportTable();
});