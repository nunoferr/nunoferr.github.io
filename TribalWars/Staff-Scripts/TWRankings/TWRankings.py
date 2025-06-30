"""
===========================================================
                   CREDITS AND INFORMATION
===========================================================

Script Name: TW Rankings fetcher
Description: This script allows users to take screenshots of the ranking pages
on TW Stats for all open worlds and servers.

Version: 1.0.6-rc2
Created on: 26/01/2025
Last Updated: 30/06/2025

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
import platform
import shutil
import argparse

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


version = "1.0.6-rc1"

print("\n-------------------------------")
print(f"TW Rankings fetcher\nVersion {version}\n\nDeveloped by: NunoF- (.com.pt)")
print("-------------------------------\n")
print("Your screenshots will be saved to " + os.path.join(os.path.expanduser("~"), "Documents", "TW-Rankings"))
print("\n\nLoading optinal parameters...")

parser = argparse.ArgumentParser()

worlds = []
serversList = {
    "net": ("https://www.tribalwars.net/", "en"),
    "se": ("https://www.tribalwars.se/", "sv"),
    "nl": ("https://www.tribalwars.nl/", "np"),
    "br": ("https://www.tribalwars.com.br/", "br"),
    "ro": ("https://www.triburile.ro/", "ro"),
    "pt": ("https://www.tribalwars.com.pt/", "pt"),
    "gr": ("https://www.fyletikesmaxes.gr/", "gr"),
    "sk": ("https://www.divoke-kmene.sk/", "sk"),
    "hu": ("https://www.klanhaboru.hu/", "hu"),
    "cz": ("https://www.divokekmeny.cz/", "cs"),
    "es": ("https://www.guerrastribales.es/", "es"),
    "it": ("https://www.tribals.it/", "it"),
    "fr": ("https://www.guerretribale.fr/", "fr"),
    "tr": ("https://www.klanlar.org/", "tr"),
    "ae": ("https://www.tribalwars.ae/", "ae"),
    "uk": ("https://www.tribalwars.co.uk/", "uk"),
    "de": ("https://www.die-staemme.de/", "de"),
    "pl": ("https://www.plemiona.pl/", "pl"),
    "si": ("https://www.vojnaplemen.si/", "si"),
    "hr": ("https://www.plemena.com/", "hr"),
    "beta": ("https://www.tribalwars.works/", "zz"),
    "th": ("https://www.tribalwars.asia/", "th"),
    "us": ("https://www.tribalwars.us/", "us"),
    "ru": ("https://www.voynaplemyon.com/", "ru"),
    "ch": ("https://www.staemme.ch/", "ch")
}

parser.add_argument('--server', required=False, default='')

parser.add_argument('--worlds', nargs='+', required=False, default=[])

args = parser.parse_args()

selected_server = args.server.lower()
selected_worlds = []

if selected_server == '':
    print("Optional server code is not present.")
elif selected_server not in serversList:
    print(f"\nServer code {selected_server} is invalid. Reseting to null.")
    selected_server = ''
else:
    print(f"\nServer set to: {selected_server}")
    selected_worlds = list(map(str.lower, args.worlds))

print("\nFinished fetching optinal parameters")


print("\n\nSetting up driver\nPlease wait...\n")

# Set up Selenium to run in headless mode (invisible browser)
chrome_options = Options()
chrome_options.add_argument("--headless")  # Run browser in headless mode
chrome_options.add_argument("--disable-gpu")  # Disable GPU acceleration
chrome_options.add_argument("--no-sandbox")  # Required for some environments
chrome_options.add_argument("--log-level=3")

def get_chromedriver_service():
    system = platform.system().lower()
    machine = platform.machine().lower()

    if system == "linux" and (machine == "aarch64" or machine.startswith("arm")):
        # ARM64 Linux: use system-installed chromedriver
        chromedriver_path = shutil.which("chromedriver")
        if chromedriver_path is None:
            raise RuntimeError(
                "chromedriver not found in PATH on ARM64 Linux.\n"
                "Please install it via: sudo apt install chromium-driver"
            )
        return Service(chromedriver_path)
    # For Windows, macOS, and x86_64 Linux, use webdriver_manager
    return Service(ChromeDriverManager().install())

service = get_chromedriver_service()

def getServer():
    clear()
    while (True):
        print("\n\n-------------------------------\nWhich server do you want to fetch the rankings from?\n-------------------------------\n")
        for server, paths in serversList.items():
            print(server + " -> " + paths[0])
        serverCode = input("\nPlease insert your server code: ").strip().lower();
        if serverCode in serversList:
            return serverCode
        print("Invalid server, please try again")

def getWorlds(server):
    clear()
    worlds = []
    print(f"Fetching {serversList[server][0] + "page/stats"}... (this might take awhile due to how slow this platform usually is)")
    driver.get(serversList[server][0] + "page/stats")

    links = driver.find_elements(By.CSS_SELECTOR, "#main table.widget table tr td:last-child")
    elements = driver.find_elements(By.CSS_SELECTOR, ".pull-right > .content-selector")

    if len(elements) > 1:
        second_selector = elements[1]
        links = second_selector.find_elements(By.CSS_SELECTOR, "li > a")
        for link in links:
            worlds.append(link.get_attribute("href").split("://")[1].split(".")[0])
    return worlds

def checkIfValidWorld(server, world):
    url = serversList[server][0].replace("www", world) + "guest.php"
    print("url: " + url)
    driver.get(url)
    return driver.current_url == url


def getWorldsWanted(server, worlds):
    clear();
    worldBeingCode = serversList[server][1]
    worldWanted = []
    while (True):
        print("\n\n-------------------------------\nWhich worlds do you want to get screenshots from?\n-------------------------------\n")
        for world in worlds:
            if (world not in worldWanted):
                print(world)
        print("all -> Select all servers (except speeds)")
        print("next -> Go to next step.\n\nTo remove a world from the selected list, re-insert it.\n")
        print("Selected worlds")
        for worldW in worldWanted:
            print(worldW)
        if (len(worldWanted) == 0):
            print("No worlds selected.\n")

        world = input("\nPlease insert a world code: ").strip().lower();
        clear();
        if world == "all":
            worldWanted = [] if worldWanted == worlds else worlds.copy()
        elif world == "next":
            if len(worldWanted) > 0: break;
            else: print("Please select at least 1 world before exiting.")
        elif world not in worlds:
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
                if mode in ["kill_player", "kill_ally"]:
                    url += "&type=all"
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
    server = selected_server or getServer()
    is_task_run = True
    if not selected_worlds:
        is_task_run = False
        worlds = getWorlds(server)
        worldWanted = getWorldsWanted(server, worlds)
    elif selected_worlds[0] == 'all':
        worldWanted = getWorlds(server)
    else:
        worldWanted = selected_worlds
            
    saveWorldToFolder(server, worldWanted)
    if is_task_run:
        break
    
    IntendsOnContinuing = input("\n\nDo you wish to continue fetching rankings?\nInsert \"1\" and enter if you do, otherwise, press enter to quit.\nAnswer: ").strip()



clear()
print("\n-------------------------------")
print(f"Thank you for using my script!\nGoodbye! ヾ(＾ ∇ ＾)\n\nDeveloped by: NunoF- (.com.pt)\nVersion {version}")
print("-------------------------------\n")
time.sleep(5)
