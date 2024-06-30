class BackSnipeScript {
    static BackSnipeTranslations = {
        en_US: {
            tableIncomingAttacks: {
                column: 'Snipes',
                button: 'Calculate Snipe'
            },
            snipeTooltip: {
                helpTitle: 'Help',
                backSnipeTitle: 'Back Snipe'
            },
            timer: {
                serverTime: 'Server Time',
                helpText: 'To provide visual assistance, you can put the time of when the attack needs to be cancelled here:',
                aim: 'The aim of this script is to facilitate the <b>calculation of backsnipes</b>',
                instructions: 'To use this script, you just need to <b>select only 1 attack in any single village</b> by clicking in the checkbox that appeared next to it, followed by the <b>"Calculate" button</b>' +
                '<br>The script will perform the calculations of at what time you should send your attack and cancel it so this can arrive <b>after the attack that you selected</b>.<br><br>' +
                'The <b>seconds need to either be zero or a multiple of 2.</b>.<br><br><b>The backsnipe must be done based on the server time</b>, which can be found on the bottom right corner ' +
                'of the screen, on "<b>Server time</b>"',
                worldTimeTitle: 'World time',
                worldTimeGuide: 'This script can also be run from the attack confirmation screens to <b>create a section</b> where it will show the ' + 
                '<b>current time of the server</b> without the user needing to search for it on the aforementioned bottom right corner of your screen.<br><br>The hours, minutes, and seconds displayed will be <b>exactly the same as the ones from the ' + 
                'server</b>, without delay.'
            },
            timePopUp: {
                title:'BackSnipe Calculator',
                requestTime: 'What is the time that you would like to use to send and cancel the attack (maximum 19:58)?',
                attackMustBeSentAt: 'The attack must be after',
                attackMustBeCancelledAt: 'And cancelled at',
                button: 'Calculate'
            },
                successMessages: {
                timerLoaded: 'The server time was loaded successfully!',
                backSnipeLoaded: 'The BackSnipe calculator loaded successfully!'
            },
            errorMessages: {
                scriptAlreadyRunning: 'Error: The script is currently active! Please reload the screen to run it again.',
                mapScreenWrongSection: 'Error: This script can be run from the map page, but only on the attack confirmation screen.',
                placeScreenWrongSection: 'Error: This script can be run from the Rally Point, but only on the attack confirmation screen.',
                noIncomingAttacks: 'Error: There are no incoming attacks to this village.',
                forbiddenScreen: 'Error: This script can only be run from the main, map or attack confirmation screens.\nRedirecting...',
                noCheckboxSelected: 'Error: Please select a checkbox.',
                wrongTimeValueInserted: 'Error: Please verify the inserted value. (Ex: "01:00" or "18:00" or "14:24")',
                lastSecondNeedsToBeEven: 'Error: The last second must either be 0 or a multiple of 2 (Ex: "01:00" or "18:00" or "14:24").',
                overMaximumAllowedTime: 'Error: The maximum possible time is 19:58.'
            }
        },
        pt_PT: {
            tableIncomingAttacks: {
                column: 'Snipes',
                button: 'Calcular Snipe'
            },
            snipeTooltip: {
                helpTitle: 'Ajuda',
                backSnipeTitle: 'Back Snipe'
            },
            timer: {
                serverTime: 'Tempo do servidor',
                helpText: 'Para auxílio visual, pode colocar aqui quando tem de cancelar o ataque:',
                aim: 'O objetivo deste script é para facilitar o <b>calculo de backsnipes</b>',
                instructions: 'Para o utilizar, basta <b>selecionar apenas 1 ataque numa determinada aldeia</b>, clicando na checkbox que apareceu ao lado dela, e em seguida, no <b>botão "Calcular"</b>' +
                '<br>O script irá fazer as contas de a que tempo deve mandar o seu ataque e cancelar para que este <b>caia depois do ataque que você selecionou ataque</b>.<br><br>' +
                'Os <b>segundos têm de ser 0 ou um múltiplo de 2</b>.<br><br><b>O backsnipe deve ser feito com base na data e hora do servidor</b>, a qual pode ser encontrada no lado direito em baixo ' +
                'do seu ecrã, em "<b>Hora do servidor</b>"',
                worldTimeTitle: 'Hora do mundo',
                worldTimeGuide: 'Este script pode também ser corrido nos ecrãs de confirmação de ataques para <b>criar um secção</b> no mesmo que irá mostrar a ' + 
                '<b>hora atual do servidor</b> sem o utilizador ter de estar à procura dela no canto inferior direito do ecrã.<br><br>As horas, minutos, e segundos ai apresentados <b>serão exatamente os mesmo dos do ' + 
                'servidor</b>, sem atraso.'
            },
            timePopUp: {
                title:'Calculador de BackSnipe',
                requestTime: 'Qual é o tempo que quer usar para enviar e cancelar o comando (máximo 19:58)?',
                attackMustBeSentAt: 'O ataque deve ser a partir de',
                attackMustBeCancelledAt: 'E cancelado em',
                button: 'Calcular'
            },
                successMessages: {
                timerLoaded: 'Tempo do servidor carregado com sucesso!',
                backSnipeLoaded: 'A calculadora de BackSnipe foi carregada com sucesso!'
            },
            errorMessages: {
                scriptAlreadyRunning: 'Erro: O script já está ativo! Por favor dê reload na página para o correr novamente.',
                mapScreenWrongSection: 'Erro: Este script pode ser corrido pela página do mapa, mas apenas na tela de confirmação de ataque.',
                placeScreenWrongSection: 'Erro: Este script pode ser corrido pela praça de reuniões, mas apenas na tela de confirmação de ataque.',
                noIncomingAttacks: 'Erro: Não existem ataques a chegar a esta aldeia.',
                forbiddenScreen: 'Erro: Este script apenas pode ser corrido através do ecrã do principal, mapa ou confirmação de ataque.\nRedirecionando...',
                noCheckboxSelected: 'Erro: Por favor selecione uma checkbox.',
                wrongTimeValueInserted: 'Erro: Por favor verifique o valor introduzido. (Ex: "01:00" ou "18:00" ou "14:24")',
                lastSecondNeedsToBeEven: 'Erro: O último segundo tem de ser um 0 ou um múltiplo de 2 (Ex: "01:00" ou "18:00" ou "14:24").',
                overMaximumAllowedTime: 'Erro: O limite de tempo possível é 19:58.'
            }
        }
    };
    
    constructor() {
        this.UserTranslation = BackSnipeScript.BackSnipeTranslations.en_US;
        if (game_data.locale in BackSnipeScript.BackSnipeTranslations) {
            this.UserTranslation = BackSnipeScript.BackSnipeTranslations[game_data.locale];
        }
        this.UserTranslation = BackSnipeScript.BackSnipeTranslations.en_US;
    }

    #getUtcDateObj(dateTime) {
        var utcDate = dateTime.getTime() + (dateTime.getTimezoneOffset() * 60000);
        return new Date(utcDate + server_utc_diff * 1000);
    }
    
    #checkIfScriptAlreadyRunning() {
        if (document.getElementById('backSnipeTimer') !== null || document.getElementById('calcBackSnipeButton') !== null) {
            UI.ErrorMessage(this.UserTranslation.errorMessages.scriptAlreadyRunning, 3000);
            return false;
        }
        return true;
    }
    
    #addScreenTimer(screen, mode = null) {
        if (!this.#checkIfScriptAlreadyRunning()) return;
        var attachTimerTo = null;
        if (screen === 'map') {
            attachTimerTo = document.getElementById('popup_box_popup_command');
            if (attachTimerTo === null) {
                UI.ErrorMessage(this.UserTranslation.errorMessages.mapScreenWrongSection, 3000);
                return;
            } else if (attachTimerTo.getElementsByTagName('h3')[0].innerText === 'Distribuir comandos') {
                UI.ErrorMessage(this.UserTranslation.errorMessages.mapScreenWrongSection, 3000);
                return;
            }
        } else {
            attachTimerTo = document.getElementById('content_value');
            if (attachTimerTo === null || mode !== null) {
                UI.ErrorMessage(this.UserTranslation.errorMessages.placeScreenWrongSection, 3000);
                return;
            } else if (attachTimerTo.getElementsByTagName('h3')[0].innerText === 'Distribuir comandos') {
                UI.ErrorMessage(this.UserTranslation.errorMessages.placeScreenWrongSection, 3000);
                return;
            }
        }
    
        attachTimerTo.style.position = "relative";
        attachTimerTo.innerHTML = '<div style="position: absolute;position: absolute;left: 450px;top: 55px;background: #c1a264;padding: 15px;text-align: center;z-index: 1000000;">' +
        '<h4>' + this.UserTranslation.timer.serverTime + '</h4><span id="backSnipeTimer"></span><br><p style="width: 235px;">' + this.UserTranslation.timer.helpText + '</p><input style="text-align: center;" type="text"></div>' + attachTimerTo.innerHTML;
        const targetNode = document.getElementById('serverTime');
        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach(mutation => {
                document.getElementById('backSnipeTimer').innerHTML = mutation.target.innerHTML;
            });
        });
        observer.observe(targetNode, { childList: true });
        UI.SuccessMessage(this.UserTranslation.successMessages.timerLoaded);
    }
    
    #incomingCommandsSectionPresent() {
        if (document.getElementById('commands_incomings') === null) {
            UI.ErrorMessage(this.UserTranslation.errorMessages.noIncomingAttacks, 3000);
            return false;
        }
        return true;
    }
    
    clearOtherIncomingAttackCheckboxes(checkboxObj) {
        Array.from(document.querySelectorAll('input[type=checkbox]')).forEach(function(checkbox) {
            if (checkbox !== checkboxObj) {
                checkbox.checked = false;
            }
        });
    }
    
    #getIncomingAttacks() {
        if (!this.#checkIfScriptAlreadyRunning()) return;
        if (!this.#incomingCommandsSectionPresent()) return;
        var incomingAttacksDiv = document.getElementById('commands_incomings');
        var incomingAttackTh = incomingAttacksDiv.getElementsByTagName('tr')[0];
        incomingAttackTh.innerHTML = '<th>' + this.UserTranslation.tableIncomingAttacks.column + '</th>' + incomingAttackTh.innerHTML;
        var incomingAttacksTr = incomingAttacksDiv.getElementsByClassName('command-row');
    
        Array.prototype.forEach.call(incomingAttacksTr, function(element) {
            element.innerHTML = '<td><input type="checkbox" class="incomingAttack" value="this" onclick="backSnipeObj.clearOtherIncomingAttackCheckboxes(this)"></td>' + element.innerHTML;
        });
        
        /* Visual fix */
        incomingAttacksDiv.getElementsByTagName('tbody')[0].querySelector('tr:last-child').querySelector('td:first-child').setAttribute('colspan', 5);
    
        /* Adds Calculate Snipe button */
        incomingAttacksDiv.getElementsByTagName('tbody')[0].innerHTML += '<tr><td><input type="button" onclick="backSnipeObj.triggerAttackCancelTimePrompt()" id="calcBackSnipeButton" class="btn" value="' + this.UserTranslation.tableIncomingAttacks.button + '"></td><td colspan="4"><a href="#"><i class="icon info-med" onclick="backSnipeObj.backDisplaySnipeTooltip()"></i></a></td></tr>'; 
    
        UI.SuccessMessage(this.UserTranslation.successMessages.backSnipeLoaded);
    }
    
    loadBackSnipeScript() {
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('screen') === 'overview') {
            this.#getIncomingAttacks();
        } else if (urlParams.get('screen') === 'map') {
            this.#addScreenTimer('map');
        } else if (urlParams.get('screen') === 'place') {
            this.#addScreenTimer('place', urlParams.get('mode'));
        } else {
            UI.ErrorMessage(this.UserTranslation.errorMessages.forbiddenScreen, 2000);
            setTimeout(function() {urlParams.set('screen', 'overview'); location.href = window.location.origin + window.location.pathname + '?' + urlParams.toString();}, 1000);
        }
    }
    
    #formatDateOutput(dateValue) {
        dateValue = this.#getUtcDateObj(dateValue);
        return ('0' + dateValue.getDay()).slice(-2) + ' ' + ('0' + dateValue.getMonth()).slice(-2) + ' ' + dateValue.getFullYear() + ' às ' + dateValue.getHours() + ':' + dateValue.getMinutes() + ':' + dateValue.getSeconds() + ':' + ('000' + dateValue.getMilliseconds()).slice(-3);
    }
    
    #createDialog(type, dialogContent, endFunction) {
        var i = $.extend({
            class_name: "",
            close_from_fader: !0,
            auto_width: !1,
            allow_close: 1,
            priority: Dialog.PRIORITY_NONE,
            subdialog: !0,
            body_class: "dialog-open"
        });
        Dialog.show(type, dialogContent, endFunction, i);
    }
    
    backDisplaySnipeTooltip() {
        var dialogContent = '<div style="text-align:center;"><h2>' + this.UserTranslation.snipeTooltip.helpTitle + '</h2><h3><br>' + this.UserTranslation.snipeTooltip.backSnipeTitle + '</h3>' + this.UserTranslation.snipeTooltip.aim + '</b>.<br><br>' + 
        '<br>' + this.UserTranslation.snipeTooltip.instructions + '<br>' + 
        '<br><br><hr><br><h3>' + this.UserTranslation.snipeTooltip.worldTimeTitle + '</h3>' + this.UserTranslation.snipeTooltip.worldTimeGuide + '<br><br></div>';
        this.#createDialog("import", dialogContent, Dialog.close());
    }
    
    #checkIfCheckboxIsSelected() {
        var checkboxes = document.getElementById('commands_incomings').querySelector('input[type=checkbox]:checked');
        if (checkboxes === null || checkboxes === undefined) {
            UI.ErrorMessage(this.UserTranslation.errorMessages.noCheckboxSelected, 3000);
            return false;
        }
        return true;
    }
    
    triggerAttackCancelTimePrompt() {
        if (!this.#checkIfCheckboxIsSelected()) return;
        var dialogContent = '<div style="text-align:center;"><h3>' + this.UserTranslation.timePopUp.title + '</h3>' + this.UserTranslation.timePopUp.requestTime + '<br><br><input type="time" id="attackCancelTime" value="18:00" min="00:00" max="19:58"/><br><br><input type="button" onclick="backSnipeObj.calcBackSnipe()" class="btn" value="' + this.UserTranslation.timePopUp.button + '"></div>';
        this.#createDialog("import", dialogContent, Dialog.close());
    }
    
    #triggerFinalPrompt(attackArrivingTimeDateObj, currentDateCancel) {
        var dialogContent = '<div style="text-align:center;"><h3>' + this.UserTranslation.timePopUp.title + '</h3>' + this.UserTranslation.timePopUp.attackMustBeSentAt + ' <b><br>' + this.#formatDateOutput(attackArrivingTimeDateObj) + '<br><br></b>' + this.UserTranslation.timePopUp.attackMustBeCancelledAt + ' <b><br>' + this.#formatDateOutput(currentDateCancel) + '<br><br></b></div>';
        this.#createDialog("import", dialogContent, Dialog.close());
    }
    
    calcBackSnipe() {
        if (!this.#checkIfCheckboxIsSelected()) return;
        var checkboxes = document.getElementById('commands_incomings').querySelector('input[type=checkbox]:checked');
        var attackArrivingUnixNoMs = checkboxes.parentElement.parentElement.childNodes[6].childNodes[1].getAttribute('data-endtime');
        var attackArrivingMs = checkboxes.parentElement.parentElement.childNodes[4].childNodes[1].innerHTML;
        var attackArrivingTime = (attackArrivingUnixNoMs + attackArrivingMs);
    
        var attackCancelTimeStr = document.getElementById('attackCancelTime').value;
        var attackCancelTime = /(\d{2}:\d{2})/.exec(attackCancelTimeStr);
        if (attackCancelTime === null) {
            attackCancelTime = /(\d{1}:\d{2})/.exec(attackCancelTimeStr);
            if (attackCancelTime === null) {
                UI.ErrorMessage(this.UserTranslation.errorMessages.wrongTimeValueInserted, 3000);
                return;
            }
        }
    
        attackCancelTime = attackCancelTime[0];
        if (Number(attackCancelTime.split(':')[1]) % 2 !== 0) {
            UI.ErrorMessage(this.UserTranslation.errorMessages.lastSecondNeedsToBeEven, 3000);
            return;
        }
    
        var attackCancelTimeInMs = Number(attackCancelTime.split(':')[0]) * 60 * 1000 + Number(attackCancelTime.split(':')[1]) * 1000;
        
        if (attackCancelTimeInMs > 1198000) {
            UI.ErrorMessage(this.UserTranslation.errorMessages.overMaximumAllowedTime, 3000);
            return;
        }
    
        var attackArrivingTimeDateObj = new Date(attackArrivingTime - attackCancelTimeInMs);
        
        /* Disregard milliseconds for the cancel time */
        var currentDateCancel = new Date(attackArrivingTimeDateObj.getTime() - attackArrivingTimeDateObj.getMilliseconds() + (attackCancelTimeInMs / 2));
    
        Dialog.close();
        this.#triggerFinalPrompt(new Date(attackArrivingTimeDateObj.getTime() + 1), currentDateCancel);
    }
}
var backSnipeObj = new BackSnipeScript();
backSnipeObj.loadBackSnipeScript()