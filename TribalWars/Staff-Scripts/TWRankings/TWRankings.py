"""
===========================================================
                   CREDITS AND INFORMATION
===========================================================

Script Name: TW Rankings fetcher
Description: This script allows users to take screenshots of the ranking pages
on TW Stats for all open worlds and servers.

Version: 1.0.2-rc5
Created on: 26/01/2025
Last Updated: 25/02/2025

Author(s):
    Nuno Ferreira - Sole Developer

License:
    MIT License
    Copyright (c) 2025 Nuno Ferreira
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

Disclaimer:
    This script is provided "as is". The author is not responsible for any damages
    or issues caused by the use of this script, whether used in commercial or personal
    environments.

===========================================================
"""

import sys
import os
import time
import ctypes
from PIL import Image

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import chromedriver_binary

from datetime import datetime

def clear(): return print('\n' * 200)


version = "1.0.2-rc.5"

print("\n-------------------------------")
print(f"TW Rankings fetcher\nVersion {version}\n\nDeveloped by: NunoF- (.com.pt)")
print("-------------------------------\n")
print("Your screenshots will be saved to " + os.path.join(os.path.expanduser("~"), "Documents", "TW-Rankings"))
print("\n\nPlease wait...\n")

# Set up Selenium to run in headless mode (invisible browser)
chrome_options = Options()
chrome_options.add_argument("--headless")  # Run browser in headless mode
chrome_options.add_argument("--disable-gpu")  # Disable GPU acceleration
chrome_options.add_argument("--no-sandbox")  # Required for some environments


service = Service(ChromeDriverManager().install())
worlds = []



serversList = {
    "net": ("https://www.tribalwars.net/", "https://www.twstats.com/", "en"),
    "se": ("https://www.tribalwars.se/", "https://se.twstats.com/", "sv"),
    "nl": ("https://www.tribalwars.nl/", "https://nl.twstats.com/", "np"),
    "br": ("https://www.tribalwars.com.br/", "https://br.twstats.com/", "br"),
    "ro": ("https://www.triburile.ro/", "https://ro.twstats.com/", "ro"),
    "no": ("https://no.tribalwars.com/", "https://no.twstats.com/", "no"),
    "pt": ("https://www.tribalwars.com.pt/", "https://pt.twstats.com/", "pt"),
    "gr": ("https://www.fyletikesmaxes.gr/", "https://gr.twstats.com/", "gr"),
    "sk": ("https://www.divoke-kmene.sk/", "https://sk.twstats.com/", "sk"),
    "hu": ("https://www.klanhaboru.hu/", "https://hu.twstats.com/", "hu"),
    "cz": ("https://www.divokekmeny.cz/", "https://cz.twstats.com/", "cs"),
    "es": ("https://www.guerrastribales.es/", "https://es.twstats.com/", "es"),
    "it": ("https://www.tribals.it/", "https://it.twstats.com/", "it"),
    "fr": ("https://www.guerretribale.fr/", "https://fr.twstats.com/", "fr"),
    "tr": ("https://www.klanlar.org/", "https://tr.twstats.com/", "tr"),
    "ae": ("https://www.tribalwars.ae/", "https://ae.twstats.com/", "ae"),
    "uk": ("https://www.tribalwars.co.uk/", "https://www.twstats.co.uk/", "uk"),
    "de": ("https://www.die-staemme.de/", "https://de.twstats.com/", "de"),
    "pl": ("https://www.plemiona.pl/", "https://pl.twstats.com/", "pl"),
    "si": ("https://www.vojnaplemen.si/", "https://si.twstats.com/", "si"),
    "hr": ("https://www.plemena.com/", "https://hr.twstats.com/", "hr"),
    "beta": ("https://www.tribalwars.works/", "https://beta.twstats.com/", "zz"),
    "th": ("https://www.tribalwars.asia/", "https://th.twstats.com/", "th"),
    "us": ("https://www.tribalwars.us/", "https://us.twstats.com/", "us"),
    "ru": ("https://www.voynaplemyon.com/", "https://ru.twstats.com/", "ru"),
    "ch": ("https://www.staemme.ch/", "https://ch.twstats.com/", "ch")
}

def getServer():
    clear();
    while (True):
        print("\n\n-------------------------------\nWhich server do you want to fetch the rankings from?\n-------------------------------\n")
        for server, paths in serversList.items():
            print(server + " -> " + paths[1])
        serverCode = input("\nPlease insert your server code: ").strip().lower();
        if serverCode in serversList:
            return serverCode
        print("Invalid server, please try again")

def getWorlds(server):
    clear();
    worlds = []
    print(f"Fetching {serversList[server][1]}... (this might take awhile due to how slow this platform usually is)")
    driver.get(serversList[server][1])

    links = driver.find_elements(By.CSS_SELECTOR, "#main table.widget table tr td:last-child")

    valid_links = [link for link in links if "(closed)" not in link.text]
    for link in valid_links:
        try:
            spanObj = link.find_element(By.TAG_NAME, 'span')
            if not spanObj.text.strip()[0] == "0" and spanObj.text.strip()[0].isdigit():
                try:
                    aObj = link.find_element(By.TAG_NAME, 'a')
                    worlds.append(aObj.get_attribute('href').split('/')[3])
                except:
                    print(f"No a found inside {link.text}")
        except:
            print(f"No span found inside {link.text}")
    return worlds


def checkIfValidWorld(server, world):
    url = serversList[server][0].replace("www", world) + "guest.php"
    print("url: " + url)
    driver.get(url)
    return driver.current_url == url


def getWorldsWanted(server):
    clear();
    worldBeingCode = serversList[server][2]
    worldWanted = []
    while (True):
        print("\n\n-------------------------------\nWhich worlds do you want to get screenshots from?\n-------------------------------\n")
        for world in worlds:
            if (world not in worldWanted):
                print(world)
        print("all -> Select all servers (except speeds)")
        print(f"Speed worlds are NOT LISTED, but can be inserted, such as: {worldBeingCode}s1\n")
        print("next -> Go to next step.\n\nTo remove a world from the selected list, re-insert it.\n")

        print("Selected worlds")
        
        for worldW in worldWanted:
            print(worldW)
        if (len(worldWanted) == 0):
            print("No worlds selected.\n")

        world = input("\nPlease insert a world code: ").strip().lower();
        clear();
        if world == "all":
            worldWanted = [] if worldWanted == worlds else worlds
        elif world == "next":
            if len(worldWanted) > 0: break;
            else: print("Please select at least 1 world before exiting.")
        else:
            if world not in worlds and world[:3] != worldBeingCode + "s":
                print("\nInvalid world, please try again")
            elif(world in worldWanted):
                worldWanted.remove(world)
            else:
                if world[:3] == worldBeingCode + "s" and not checkIfValidWorld(server, world):
                    print(f"Speed world code inserted, but the world doesn't exist")
                else:
                    worldWanted.append(world)
    return worldWanted;

def createRankingsFolder(server, now, world):
    currentTime = now.strftime("%d-%m-%Y_%H-%M-%S");
    documents_path = os.path.join(os.path.expanduser("~"), "Documents", "TW-Rankings", server, currentTime, world)
    os.makedirs(documents_path, exist_ok=True)
    print(f"\n\nSaving world to folder {documents_path}\n")
    return documents_path;


def createFullScreenshotFile(driver, screenshotsPath):
    fullPageScreenshot = os.path.join(screenshotsPath, "fullPageScreenshot.png")
    driver.save_screenshot(fullPageScreenshot)
    print(f"Full screenshot saved to {fullPageScreenshot}")
    return fullPageScreenshot

def cropImage(server, world, mode, screenshotsPath, img, x1, y1, x2, y2):
    dpi = 1.0;
    if sys.platform == "win32" or sys.platform == "cygwin": #windows
        dpi = ctypes.windll.shcore.GetScaleFactorForDevice(0) / 100
    elif sys.platform == "darwin": #mac
        dpi = 2.0
    elif sys.platform.startswith("linux"): #linux
        dpi = 1.0
    
    croppedImg = img.crop((int(x1 * dpi), int(y1 * dpi), int(x2 * dpi), int(y2 * dpi)))
    if (server == "br" or server == "pt"):
        translateModesArr = [("player", "Jogadores"), ("ally", "Tribos"), ("dominance", "Dominancia"), ("kill_ally", "OD Geral Tribos"), ("kill_player", "OD Geral Players"), ("wars", "Guerras")]
        for translationMode in translateModesArr:
            if translationMode[0] == mode:
                mode = translationMode[1]
                break;
            
    croppedScreenshotPath = os.path.join(screenshotsPath, f"{world}-{mode}.png")
    croppedImg.save(croppedScreenshotPath)
    print(f"Cropped screenshot saved to {croppedScreenshotPath}")


def waitForAnimation(animationName, driver):
    print(f"Waiting for {animationName} animation to finish...")
    driver.execute_script("""
        let element = document.querySelector("#content_value table table:not(:first-child) .progress-bar:first-child > div");

        return new Promise(resolve => {
            element.addEventListener('animationend', () => {
                resolve(true);  // Animation is complete
            });
        });
    """)
    print("Animation finished!")


def savePlayerOrAllyPage(driver, screenshotsPath, server, world, mode):
    elementsToRemove = driver.find_elements(By.CSS_SELECTOR, "#content_value table td:has(div.ranking-top3) table:not(:first-of-type)")
    if elementsToRemove:
        extraHeightToRemove = sum(el.size['height'] for el in elementsToRemove)
        element = driver.find_element(By.CSS_SELECTOR, "#content_value table td:has(div.ranking-top3)")
        fullPageScreenshot = createFullScreenshotFile(driver, screenshotsPath)
        cropImage(server, world, mode, screenshotsPath, Image.open(fullPageScreenshot), element.location['x'], element.location['y'], element.location['x'] + element.size['width'], element.location['y'] + element.size['height'] - extraHeightToRemove);
    else:
        print(f"No {mode}'s found on {mode} page.")


def saveDominancePage(driver, screenshotsPath, server, world, mode):
    if driver.find_elements(By.CSS_SELECTOR, "#content_value table table:not(:first-child)"):
        waitForAnimation("Dominance load bar", driver)
        bothTables = driver.find_elements(By.CSS_SELECTOR, "#content_value table table:not(:first-child)")
        element = bothTables[0]
        fullPageScreenshot = createFullScreenshotFile(driver, screenshotsPath)
        cropImage(server, world, mode, screenshotsPath, Image.open(fullPageScreenshot), element.location['x'], element.location['y'], element.location['x'] + element.size['width'] + bothTables[1].size['width'] + 11, element.location['y'] + element.size['height']);
    else:
        print(f"No {mode} element found on {mode} page.")


def saveKillAllyKillPlayerPage(driver, screenshotsPath, server, world, mode):
    allTables = driver.find_elements(By.CSS_SELECTOR, "#content_value table table")
    element = allTables[2]
    fullPageScreenshot = createFullScreenshotFile(driver, screenshotsPath)
    cropImage(server, world, mode, screenshotsPath, Image.open(fullPageScreenshot), element.location['x'], element.location['y'], element.location['x'] + element.size['width'], element.location['y'] + element.size['height']);


def saveWarsPage(driver, screenshotsPath, server, world, mode):
    allTables = driver.find_elements(By.CSS_SELECTOR, "#content_value table table")
    element = allTables[1]
    fullPageScreenshot = createFullScreenshotFile(driver, screenshotsPath)
    cropImage(server, world, mode, screenshotsPath, Image.open(fullPageScreenshot), element.location['x'], element.location['y'], element.location['x'] + element.size['width'], element.location['y'] + element.size['height']);

    
def removeTempFile(screenshotsPath):
    fullPageScreenshot = os.path.join(screenshotsPath, "fullPageScreenshot.png")
    os.remove(fullPageScreenshot)
    print(f"Temporary screenshot deleted: {fullPageScreenshot}")
    

def saveWorldToFolder(server, worldWanted):
    clear();
    now = datetime.now()
    try:
        for world in worldWanted:
            screenshotsPath = createRankingsFolder(server, now, world)
            for mode in ["player", "ally", "dominance", "kill_ally", "kill_player", "wars"]:
                url = serversList[server][0].replace("www", world) + "guest.php?screen=ranking&mode=" + mode
                print(url)
                driver.get(url)                        
                if mode in ["player", "ally"]:
                    savePlayerOrAllyPage(driver, screenshotsPath, server, world, mode)
                elif mode == "dominance":
                    saveDominancePage(driver, screenshotsPath, server, world, mode)  
                elif mode in ["kill_ally", "kill_player"]:
                    saveKillAllyKillPlayerPage(driver, screenshotsPath, server, world, mode)
                elif mode == "wars":
                    saveWarsPage(driver, screenshotsPath, server, world, mode)       
            removeTempFile(screenshotsPath)

        if (server in ["pt", "br"]):
            htmlTemplate = '''<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Template</title>
    </head>
    <body>
    [twchangelog="intro"]XXXXXXXX[/twchangelog]<br/><br/>

    [SPOILER="Top Tribos"]
    <br/><br/>

    [/SPOILER]
    <br/><br/>
    [SPOILER="Top Players"]
    <br/><br/>

    [/SPOILER]
    <br/><br/>
    [SPOILER="Dominância"]
    <br/><br/>

    [/SPOILER]
    <br/><br/>
    [SPOILER="OD Geral Tribos"]
    <br/><br/>

    [/SPOILER]
    <br/><br/>
    [SPOILER="OD Geral Players"]
    <br/><br/>

    [/SPOILER]
    <br/><br/>
    [SPOILER="Guerras"]
    <br/><br/>

    [/SPOILER]
    </body>
    </html>'''
            with open(os.path.join(os.path.expanduser("~"), "Documents", "TW-Rankings", server, now.strftime("%d-%m-%Y_%H-%M-%S")) + "/" + "template.html", "w", encoding="utf-8") as file:
                file.write(htmlTemplate)
            print("Created template file...")
    except Exception as e:
        print(f"Exception: {e}")
    finally:
        driver.quit()
        clear();
        print("Screenshots process finished! ＼(＾▽＾)／")

    
IntendsOnContinuing = "1"
while(IntendsOnContinuing == "1"):
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.set_window_size(1920, 1480)
    server = getServer()
    worlds = getWorlds(server)
    worldWanted = getWorldsWanted(server)
    saveWorldToFolder(server, worldWanted)
    IntendsOnContinuing = input("\n\nDo you wish to continue fetching rankings?\nInsert \"1\" and enter if you do, otherwise, press enter to quit.\nAnswer: ").strip()



clear()
print("\n-------------------------------")
print(f"Thank you for using my script!\nGoodbye! ヾ(＾ ∇ ＾)\n\nDeveloped by: NunoF- (.com.pt)\nVersion {version}")
print("-------------------------------\n")
time.sleep(5)
