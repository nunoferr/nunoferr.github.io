"""
===========================================================
                   CREDITS AND INFORMATION
===========================================================

Script Name: TW Rankings fetcher
Description: This script allows users to take screenshots of the ranking pages
on TW Stats for all open worlds and servers.

Version: 1.0.5-rc4
Created on: 26/01/2025
Last Updated: 18/02/2025

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


version = "1.0.5-rc.4"

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
    "net": ("http://www.tribalwars.net/", "http://www.twstats.com/"),
    "se": ("http://www.tribalwars.se/", "http://se.twstats.com/"),
    "nl": ("http://www.tribalwars.nl/", "http://nl.twstats.com/"),
    "br": ("http://www.tribalwars.com.br/", "http://br.twstats.com/"),
    "ro": ("http://www.triburile.ro/", "http://ro.twstats.com/"),
    "no": ("http://no.tribalwars.com/", "http://no.twstats.com/"),
    "pt": ("https://www.tribalwars.com.pt/", "http://pt.twstats.com/"),
    "gr": ("http://www.fyletikesmaxes.gr/", "http://gr.twstats.com/"),
    "sk": ("http://www.divoke-kmene.sk/", "http://sk.twstats.com/"),
    "hu": ("http://www.klanhaboru.hu/", "http://hu.twstats.com/"),
    "cz": ("http://www.divokekmeny.cz/", "http://cz.twstats.com/"),
    "es": ("http://www.guerrastribales.es/", "http://es.twstats.com/"),
    "it": ("http://www.tribals.it/", "http://it.twstats.com/"),
    "fr": ("http://www.guerretribale.fr/", "http://fr.twstats.com/"),
    "tr": ("http://www.klanlar.org/", "http://tr.twstats.com/"),
    "ae": ("http://www.tribalwars.ae/", "http://ae.twstats.com/"),
    "uk": ("http://www.tribalwars.co.uk/", "http://www.twstats.co.uk/"),
    "de": ("http://www.die-staemme.de/", "http://de.twstats.com/"),
    "pl": ("http://www.plemiona.pl/", "http://pl.twstats.com/"),
    "si": ("http://www.vojnaplemen.si/", "http://si.twstats.com/"),
    "hr": ("http://www.plemena.com/", "http://hr.twstats.com/"),
    "beta": ("https://www.tribalwars.works/", "http://beta.twstats.com/"),
    "th": ("http://www.tribalwars.asia/", "http://th.twstats.com/"),
    "us": ("http://www.tribalwars.us/", "http://us.twstats.com/"),
    "ru": ("https://www.voynaplemyon.com/", "http://ru.twstats.com/"),
    "ch": ("http://www.staemme.ch/", "http://ch.twstats.com/")
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

def getWorldsWanted(worlds):
    clear();
    worldWanted = []
    while (True):
        print("\n\n-------------------------------\nWhich worlds do you want to get screenshots from?\n-------------------------------\n")
        for world in worlds:
            if (world not in worldWanted):
                print(world)
        print("all -> Select all servers\n")
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
            if world not in worlds:
                print("\nInvalid world, please try again")
            elif(world in worldWanted):
                worldWanted.remove(world)
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
    extraHeightToRemove = sum(el.size['height'] for el in elementsToRemove)
    element = driver.find_element(By.CSS_SELECTOR, "#content_value table td:has(div.ranking-top3)")
    fullPageScreenshot = createFullScreenshotFile(driver, screenshotsPath)
    cropImage(server, world, mode, screenshotsPath, Image.open(fullPageScreenshot), element.location['x'], element.location['y'], element.location['x'] + element.size['width'], element.location['y'] + element.size['height'] - extraHeightToRemove);


def saveDominancePage(driver, screenshotsPath, server, world, mode):
    waitForAnimation("Dominance load bar", driver)
    bothTables = driver.find_elements(By.CSS_SELECTOR, "#content_value table table:not(:first-child)")
    element = bothTables[0]
    fullPageScreenshot = createFullScreenshotFile(driver, screenshotsPath)
    cropImage(server, world, mode, screenshotsPath, Image.open(fullPageScreenshot), element.location['x'], element.location['y'], element.location['x'] + element.size['width'] + bothTables[1].size['width'] + 11, element.location['y'] + element.size['height']);


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
    worldWanted = getWorldsWanted(worlds)
    saveWorldToFolder(server, worldWanted)
    IntendsOnContinuing = input("\n\nDo you wish to continue fetching rankings?\nInsert \"1\" and enter if you do, otherwise, press enter to quit.\nAnswer: ").strip()



clear()
print("\n-------------------------------")
print(f"Thank you for using my script!\nGoodbye! ヾ(＾ ∇ ＾)\n\nDeveloped by: NunoF- (.com.pt)\nVersion {version}")
print("-------------------------------\n")
time.sleep(5)
