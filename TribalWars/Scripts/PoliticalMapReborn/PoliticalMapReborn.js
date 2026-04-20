/*
 * Script Name: Political Map Reborn
 * Version: v0.1.10
 * Last Updated:
 * Author: NunoF-
 * Author URL: https://nunoferr.github.io/
 * Author Contact: Discord - ducks4ever
 * Special Thanks To:  Shinko to Kuma support during development, Thomas "Sass" Ameye for making their MapSDK 
 *                     publicly available, and valtheran88 for their political map script expertise and help beta testing.
 * Approved:
 * Approved Date:
 * Forum URL (.net):
 * Mod:
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/
MapSdk = {
  manualReload: false,
  init(mapStore, mapBounds, politicalMapRebornGroups) {
    this.mapStore = mapStore; 
    this.clustersMap = this.generateGrid(this.mapStore, mapBounds, politicalMapRebornGroups);

    if (!this.mapOverlay.popup._displayForVillage) { //doesn't exist yet
      this.mapOverlay.popup._displayForVillage = this.mapOverlay.popup.displayForVillage;
    }

    if (!this.mapOverlay.mapHandler._spawnSector) { //doesn't exist yet
      this.mapOverlay.mapHandler._spawnSector = this.mapOverlay.mapHandler.spawnSector;
    }

    this.mapOverlay.mapHandler.spawnSector = (data, sector) => {
      this.mapOverlay.mapHandler._spawnSector(data, sector);
      var el = $('#political_map_canvas_' + sector.x + '_' + sector.y);
      if (!el.length) {
        var canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.width = this.mapOverlay.map.scale[0] * this.mapOverlay.map.sectorSize + 8;
        canvas.height = this.mapOverlay.map.scale[1] * this.mapOverlay.map.sectorSize + 8;
        canvas.style.left = '-4px';
        canvas.style.top = '-4px';
        canvas.style.zIndex = 10;
        canvas.id = 'political_map_canvas_' + sector.x + '_' + sector.y;
        sector.appendElement(canvas);

        this.redrawSector(sector, canvas, sector.x, sector.y);
      }

      for (var key in this.mapOverlay.minimap._loadedSectors) {
        var sector = this.mapOverlay.minimap._loadedSectors[key];
        var el = $('#political_map_topo_canvas_' + sector.x + '_' + sector.y);
        if (!el.length) {
            var canvas = document.createElement('canvas');
            canvas.style.position = 'absolute';
            canvas.width = '250';
            canvas.height = '250';
            canvas.style.zIndex = 11;
            canvas.id = 'political_map_topo_canvas_' + sector.x + '_' + sector.y;
            sector.appendElement(canvas, 0, 0);
  
            this.redrawMiniSector(sector, canvas, sector.x, sector.y);
        }
      };
    };

    this.mapOverlay.popup.displayForVillage = ((map) => function(e, a, t) {
      this._displayForVillage(e, a, t);

      const villageId = e && e.id;
      if (!villageId) return;

      const villageData = map.mapStore[villageId];
      // Barbarian villages won't have villageData set
      if (villageData === undefined || !villageData.showTempOwnershipLog) return;

      const playersMap = politicalMapReborn.playersMap;
      const { getPlayerGroup, groupToColor } = politicalMapReborn.getGroupLookup();
      const formatGroupName = (groupName) =>
        groupName ? `<div class="group" style="color: ${groupToColor[groupName]}">${groupName}</div>` : '';
      const triggerGroupColor = groupToColor[villageData.lastOwnershipTriggerGroup] ?? '#2b7de9';
      const formatTimestamp = (unixTs) => {
        const d = new Date(Number(unixTs) * 1000);
        const p = (n) => String(n).padStart(2, '0');
        return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
      };
      const getOwnerName = (ownerId) => {
        if (ownerId == 0) return window.lang['acd537450651fef7501d8f80cb075fa3'];
        return playersMap[ownerId]?.playerName ?? `Guest (${ownerId})`;
      };

      let ownershipRows = '';
      for (let i = villageData.tempOwnershipLog.length - 1; i >= 0; i--) {
        const { unixTimestamp, oldOwner, newOwner } = villageData.tempOwnershipLog[i];
        ownershipRows += `<tr>
          <td>${formatTimestamp(unixTimestamp)}</td>
          <td>${getOwnerName(newOwner)}</td>
          <td>${formatGroupName(getPlayerGroup(newOwner))}</td>
          <td>${getOwnerName(oldOwner)}</td>
          <td>${formatGroupName(getPlayerGroup(oldOwner))}</td>
        </tr>`;
      }

      map.ensurePopupConquerStyles();

      const popup = $('#map_popup');
      const table = popup.find('#info_content').first();
      if (!table.length) return;
      if (!table.is('table')) return;

      const tbody = table.children('tbody');
      if (!tbody.length) return;
      if (tbody.children('tr.pmrb-extra-row').length) return;

      const conquerRows = `
        <tr class="pmrb-extra-row">
          <th colspan="2">
            Conquer History
            <div class="info-badge" style="background: ${triggerGroupColor}"><div class="info-badge-text">H</div></div>
          </th>
        </tr>
        <tr class="pmrb-extra-row">
          <td colspan="2">
            <table class="conquer-table">
              <tbody>
                <tr>
                  <th class="date-cell">Date</th>
                  <th>New Owner</th>
                  <th>Group</th>
                  <th>Old Owner</th>
                  <th>Group</th>
                </tr>
                ${ownershipRows}
              </tbody>
            </table>
          </td>
        </tr>`;

      const anchorRow = tbody.children('tr#info_ally_row').first();
      if (anchorRow.length) {
        anchorRow.after(conquerRows);
        return;
      }

      const rows = tbody.children('tr');
      if (!rows.length) return;
      $(rows[rows.length - 1]).before(conquerRows);
    })(this);

    this.groupsColors = politicalMapRebornGroups.groupsColors;
    this.mapOverlay.reload();
    return 'Initialised Map SDK';
  },
  ensurePopupConquerStyles() {
    if ($('#popup-conquer-style').length) return;

    $('head').append(`<style id="popup-conquer-style">
      #map_popup #info_content .info-badge {
        display: inline-block;
        background: blue;
        width: 8px;
        height: 8px;
        padding: 4px;
        color: white;
        font-size: 9px;
        text-align: center;
        font-weight: bold;
        border-radius: 10px;
      }

      #map_popup #info_content .info-badge .info-badge-text {
        margin-top: -1px;
      }

      #map_popup #info_content .conquer-table {
        width: 100%;
        background: #e5d7b2;
      }

      #map_popup #info_content .date-cell {
        width: 140px;
      }

      #map_popup #info_content .group-ally {
        color: #6ecf6e;
        font-weight: bold;
      }

      #map_popup #info_content .group-enemy {
        color: red;
        font-weight: bold;
      }

      #map_popup #info_content .group {
        font-weight: bold;
      }

      #map_popup #info_content .center {
        text-align: center;
      }
    </style>`);
  },
  // Helper to get ally_id at coordinate
  getGroupId(villages, x, y) {
    return villages[x.toString().padStart(3, '0') + y.toString().padStart(3, '0')]?.groupId;
  },
  // Helper to get player_id at coordinate
  getPlayerId(villages, x, y) {
    return villages[x.toString().padStart(3, '0') + y.toString().padStart(3, '0')]?.playerId;
  },
  // Helper to get ally_id at coordinate
  getAllyId(villages, x, y) {
    return villages[x.toString().padStart(3, '0') + y.toString().padStart(3, '0')]?.allyId;
  },
  getCoordKey(x, y) {
    return x.toString().padStart(3, '0') + y.toString().padStart(3, '0');
  },
  getCellIndex(x, y, smallestX, smallestY, width) {
    return (y - smallestY) * width + (x - smallestX);
  },
  generateGrid(villages, mapBounds, politicalMapRebornGroups) {
    var result = {};
    var villagesToGroupsCoords = {};
    var groupIds = [];
    var groupIndexById = {};
    var playerIds = [];
    var playerIndexById = {};
    var playerVillagesByGroup = {};
    var allGroupVillages = [];
    var villagesTempOwnershipLog = {};
    var villagesLastOwnershipTriggerGroup = {};
    var playerIdToAllyId = {};

    // Pass 1: collect group village coordinates and compute tight grid bounds.
    // mapBounds covers all non-barbarian villages, which can extend far beyond
    // group territory. Using tight bounds prevents isolated painted cells at
    // map extremes where no group village exists.
    let gridMinX = Infinity, gridMaxX = -Infinity;
    let gridMinY = Infinity, gridMaxY = -Infinity;
    const groupVillageEntries = [];

    for (const [key, village] of Object.entries(villages)) {
      if (village) {
        // To handle cases where players are allyless or their tribe was not added to a group,
        // but the player themselves were added to a group, we check player group first before tribe group and then village.
        const groupId = politicalMapRebornGroups.players[village.playerId] ?? politicalMapRebornGroups.allies[village.allyId] ?? politicalMapRebornGroups.villages[key];

        if (groupId !== undefined) {
          const x = Number(village.x), y = Number(village.y);
          if (x < gridMinX) gridMinX = x;
          if (x > gridMaxX) gridMaxX = x;
          if (y < gridMinY) gridMinY = y;
          if (y > gridMaxY) gridMaxY = y;
          var villageData = { key, x, y, groupId, playerId: village.playerId };
          if (village.showTempOwnershipLog) {
            villageData.tempOwnershipLog = village.tempOwnershipLog;
            villageData.lastOwnershipTriggerGroup = village.lastOwnershipTriggerGroup ?? '';
          }
          groupVillageEntries.push(villageData);
          playerIdToAllyId[village.playerId] = village.allyId;
        }
      }
    }

    if (!groupVillageEntries.length) {
      return result;
    }

    // Expand bounds by 8 fields in each direction for padding around group territory
    gridMinX -= 8; gridMaxX += 8;
    gridMinY -= 8; gridMaxY += 8;

    // Grid dimensions based on group villages only
    var width = gridMaxX - gridMinX + 1;
    var height = gridMaxY - gridMinY + 1;
    var cellCount = width * height;

    // Circle boundary: center of the bounding box, radius = half the larger dimension.
    // Clips the corners of the bounding rectangle so the painted territory appears circular.
    const centerX = (gridMinX + gridMaxX) / 2;
    const centerY = (gridMinY + gridMaxY) / 2;
    const radius = Math.max(width, height) / 2;
    const radiusSq = radius * radius;

    // Pass 2: build source lists using tight grid bounds
    for (const { key, x, y, groupId, playerId, tempOwnershipLog, lastOwnershipTriggerGroup } of groupVillageEntries) {
      if (groupIndexById[groupId] === undefined) {
        groupIndexById[groupId] = groupIds.length;
        groupIds.push(groupId);
        playerVillagesByGroup[groupId] = [];
      }

      if (playerIndexById[playerId] === undefined) {
        playerIndexById[playerId] = playerIds.length;
        playerIds.push(playerId);
      }

      const groupIndex = groupIndexById[groupId];
      const playerIndex = playerIndexById[playerId];
      const cellIndex = this.getCellIndex(x, y, gridMinX, gridMinY, width);

      playerVillagesByGroup[groupId].push({ key, cellIndex, ownerIndex: playerIndex });
      allGroupVillages.push({ key, cellIndex, ownerIndex: groupIndex });
      villagesToGroupsCoords[this.getCoordKey(x, y)] = groupId;
      if (tempOwnershipLog !== undefined) villagesTempOwnershipLog[this.getCoordKey(x, y)] = tempOwnershipLog;
      if (lastOwnershipTriggerGroup !== undefined) villagesLastOwnershipTriggerGroup[this.getCoordKey(x, y)] = lastOwnershipTriggerGroup;
    }

    // Multi-source BFS flood fill: all source villages are seeded into the queue at once,
    // sorted so that higher village IDs are processed first (tie-break). 
    // BFS expands outward one step at a time in 4 directions,
    // so each cell is reached by the nearest source first.
    // Voronoi partition, but O(cells + villages).
    const spreadOwnership = (assignments, sources, canClaimCell, queueSize) => {
      var queue = new Int32Array(queueSize);
      var head = 0, tail = 0;

      // Seed: claim each source cell and enqueue it
      for (const source of sources) {
        if (assignments[source.cellIndex] === -1) {
          assignments[source.cellIndex] = source.ownerIndex;
          queue[tail++] = source.cellIndex;
        }
      }

      // Expand: propagate ownership to unclaimed neighbours
      while (head < tail) {
        const ci = queue[head++];
        const ownerIndex = assignments[ci];
        const cx = gridMinX + (ci % width);
        const cy = gridMinY + Math.floor(ci / width);

        for (const ni of [
          cy > gridMinY ? ci - width : -1, // north
          cx < gridMaxX ? ci + 1     : -1, // east
          cy < gridMaxY ? ci + width  : -1, // south
          cx > gridMinX ? ci - 1     : -1  // west
        ]) {
          if (ni !== -1 && assignments[ni] === -1 && canClaimCell(ni)) {
            assignments[ni] = ownerIndex;
            queue[tail++] = ni;
          }
        }
      }
    };

    const byKeyDesc = (a, b) => parseInt(b.key, 10) - parseInt(a.key, 10);
    allGroupVillages.sort(byKeyDesc);
    Object.values(playerVillagesByGroup).forEach(list => list.sort(byKeyDesc));

    const canClaimCircle = (ni) => {
      const nx = gridMinX + (ni % width);
      const ny = gridMinY + Math.floor(ni / width);
      const dx = nx - centerX, dy = ny - centerY;
      return dx * dx + dy * dy <= radiusSq;
    };

    var groupAssignments = new Int32Array(cellCount).fill(-1);
    spreadOwnership(groupAssignments, allGroupVillages, canClaimCircle, cellCount);

    var playerAssignments = new Int32Array(cellCount).fill(-1);
    var groupCellCounts = new Int32Array(groupIds.length);

    for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
      const groupIndex = groupAssignments[cellIndex];
      if (groupIndex !== -1) {
        groupCellCounts[groupIndex]++;
      }
    }

    for (let groupIndex = 0; groupIndex < groupIds.length; groupIndex++) {
      const groupId = groupIds[groupIndex];
      const groupPlayers = playerVillagesByGroup[groupId];

      if (!groupPlayers.length || !groupCellCounts[groupIndex]) {
        continue;
      }

      spreadOwnership(playerAssignments, groupPlayers, (ci) => groupAssignments[ci] === groupIndex, groupCellCounts[groupIndex]);
    }

    for (let y = gridMinY; y <= gridMaxY; y++) {
      for (let x = gridMinX; x <= gridMaxX; x++) {
        const dx = x - centerX, dy = y - centerY;
        if (dx * dx + dy * dy > radiusSq) continue;
        const key = this.getCoordKey(x, y);
        const ci = this.getCellIndex(x, y, gridMinX, gridMinY, width);
        const assignedPlayerId = playerAssignments[ci] === -1 ? undefined : playerIds[playerAssignments[ci]];
        result[key] = {
          groupId:  groupAssignments[ci]  === -1 ? undefined : groupIds[groupAssignments[ci]],
          playerId: assignedPlayerId,
          allyId:   assignedPlayerId !== undefined ? playerIdToAllyId[assignedPlayerId] : undefined,
          isGroupVillage: villagesToGroupsCoords[key] || false
        };
        if (villagesTempOwnershipLog[key] !== undefined) {
          result[key].tempOwnershipLog = villagesTempOwnershipLog[key];
          result[key].lastOwnershipTriggerGroup = villagesLastOwnershipTriggerGroup[key] ?? '';
        }
      }
    }
    return result;
  },
  pixelByCoord(x_s, y_s, x_c, y_c) {
    st_pixel = this.mapOverlay.map.pixelByCoord(x_s, y_s);
    originXY = this.mapOverlay.map.pixelByCoord(x_c, y_c);
    originX = originXY[0] - st_pixel[0] + this.mapOverlay.tileSize[0] / 2;
    originY = originXY[1] - st_pixel[1] + this.mapOverlay.tileSize[1] / 2;
    return [originX, originY];
  },
  getTileBasePosition(x_s, y_s, x_c, y_c, offsetX, offsetY) {
    const pos = this.pixelByCoord(x_s, y_s, x_c, y_c);
    const halfScaleX = TWMap.map.scale[0] / 2;
    const halfScaleY = TWMap.map.scale[1] / 2;

    return {
      baseX: pos[0] - halfScaleX + offsetX,
      baseY: pos[1] - halfScaleY + offsetY,
      width: TWMap.map.scale[0],
      height: TWMap.map.scale[1]
    };
  },
  drawCircleIcon(ctx, x, y, radius, fillStyle, options = {}) {
    const {
      borderWidth = 1,
      strokeStyle = 'black',
      text,
      textColor = 'white',
      font = 'bold 8px Arial',
      textNudgeY = 0.5
    } = options;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();

    if (text) {
      ctx.fillStyle = textColor;
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + textNudgeY);
    }
  },
  paintConquerIcon(ctx, village, x_s, y_s, x_c, y_c) {
    const { baseX, baseY, width } = this.getTileBasePosition(x_s, y_s, x_c, y_c, 4, 4);
    const iconMargin = 5;
    const iconX = baseX + width - iconMargin;
    const iconY = baseY + iconMargin;
    const triggerGroup = village.lastOwnershipTriggerGroup;
    const triggerGroupColor = politicalMapReborn?.groups?.[triggerGroup]?.color ?? 'black';

    this.drawCircleIcon(ctx, iconX, iconY, 6, triggerGroupColor, {
      borderWidth: 1,
      text: 'H'
    });
  },
  paintGroupVillageIcon(ctx, village, x_s, y_s, x_c, y_c) {
    const { baseX, baseY, width } = this.getTileBasePosition(x_s, y_s, x_c, y_c, -39, 4);
    const iconMargin = 5;
    const iconX = baseX + width - iconMargin;
    const iconY = baseY + iconMargin;
    const fillColor = this.groupsColors[village.groupId]?.replace(/,\s*[\d.]+\)$/, ', 1)') ?? 'black';

    this.drawCircleIcon(ctx, iconX, iconY, 3, fillColor, {
      borderWidth: 0.5
    });
  },
  paintBorders(x_s, y_s, x_c, y_c, colorAlly, canvas, borderLocation, hasBorders) {
    // x_s = sector init x, y_s = sector init y.
    // x_c = village x
    // y_c = village y
    // hasBorders = { north, east, south, west, northwest, northeast, southwest, southeast }
    let ctx = canvas.getContext('2d');

    let pos = this.pixelByCoord(x_s, y_s, x_c, y_c);
    const halfScaleX = TWMap.map.scale[0] / 2;
    const halfScaleY = TWMap.map.scale[1] / 2;
    let baseX = pos[0] - halfScaleX + 4; // 4 is the ofsett of the canvas
    let baseY = pos[1] - halfScaleY + 4; // 4 is the ofsett of the canvas

    // Prepare color once
    colorAlly = colorAlly ?? 'hsl(0, 0%, 90%, 1)';
    let colorOpaque = colorAlly;

    // Set line style once
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = colorOpaque;

    const W = TWMap.map.scale[0];
    const H = TWMap.map.scale[1];
    const inset = 4; // px inset from cell edge — controls gap between adjacent cluster borders
    const ext = 3;   // px extension past cell edge to fill outer corners
    const r = 5;     // corner arc radius (north/south draw the arcs; east/west skip that region)

    ctx.beginPath();
    if (borderLocation === 0) {
      // north (west -> east) — draws NW and NE corner arcs
      const y = baseY + inset;
      const xL = baseX + (hasBorders.west ? inset : !hasBorders.northwest ? -ext : 0);
      const xR = baseX + W  + (hasBorders.east ? -inset : !hasBorders.northeast ? ext : 0);

      if (hasBorders.west) { ctx.moveTo(xL, y + r); ctx.arcTo(xL, y, xL + r, y, r); }
      else                  { ctx.moveTo(xL, y); }

      if (hasBorders.east) { ctx.lineTo(xR - r, y); ctx.arcTo(xR, y, xR, y + r, r); }
      else                 { ctx.lineTo(xR, y); }

    } else if (borderLocation === 1) {
      // east (north -> south) — arcs are owned by north/south, so skip arc region
      const x  = baseX + W - inset;
      const y1 = baseY + (hasBorders.north ? inset + r : !hasBorders.northeast ? -ext : 0);
      const y2 = baseY + H  + (hasBorders.south ? -(inset + r) : !hasBorders.southeast ? ext : 0);
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);

    } else if (borderLocation === 2) {
      // south (west -> east) — draws SW and SE corner arcs
      const y = baseY + H - inset;
      const xL = baseX + (hasBorders.west ? inset : !hasBorders.southwest ? -ext : 0);
      const xR = baseX + W  + (hasBorders.east ? -inset : !hasBorders.southeast ? ext : 0);

      if (hasBorders.west) { ctx.moveTo(xL, y - r); ctx.arcTo(xL, y, xL + r, y, r); }
      else                  { ctx.moveTo(xL, y); }

      if (hasBorders.east) { ctx.lineTo(xR - r, y); ctx.arcTo(xR, y, xR, y - r, r); }
      else                 { ctx.lineTo(xR, y); }

    } else if (borderLocation === 3) {
      // west (north -> south) — arcs are owned by north/south, so skip arc region
      const x  = baseX + inset;
      const y1 = baseY + (hasBorders.north ? inset + r : !hasBorders.northwest ? -ext : 0);
      const y2 = baseY + H  + (hasBorders.south ? -(inset + r) : !hasBorders.southwest ? ext : 0);
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
    }
    ctx.stroke();
  },
  paintBorders_mini(sector, x_c, y_c, colorAlly, canvas, borderLocation, hasBorders) {
    // sector = minimap sector object
    // x_c = village x coordinate
    // y_c = village y coordinate
    // hasBorders = { north, east, south, west, northwest, northeast, southwest, southeast }
    let ctx = canvas.getContext('2d');

    // Convert village coordinates to minimap pixels (each coordinate = 5 pixels, offset by 3)
    let baseX = (x_c - sector.x) * 5;
    let baseY = (y_c - sector.y) * 5;

    // Single black border on the edge
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = colorAlly;

    ctx.beginPath();
    if (borderLocation === 0) {
      // north (west -> east)  
      let x1 = baseX + (hasBorders.west ? 0 : !hasBorders.northwest ? 0 : 0);
      let x2 = baseX + 5 + (hasBorders.east ? 0 : !hasBorders.northeast ? 0 : 0);
      ctx.moveTo(x1, baseY);
      ctx.lineTo(x2, baseY);
      ctx.stroke();
    } else if (borderLocation === 1) {
      // east (north -> south)
      let y1 = baseY + (hasBorders.north ? 0 : !hasBorders.northeast ? 0 : 0);
      let y2 = baseY + 5 + (hasBorders.south ? 0 : !hasBorders.southeast ? 0 : 0);
      ctx.moveTo(baseX + 5, y1);
      ctx.lineTo(baseX + 5, y2);
    } else if (borderLocation === 2) {
      // south (west -> east)
      let x1 = baseX + (hasBorders.west ? 0 : !hasBorders.southwest ? 0 : 0);
      let x2 = baseX + 5 + (hasBorders.east ? 0 : !hasBorders.southeast ? 0 : 0);
      ctx.moveTo(x1, baseY + 5);
      ctx.lineTo(x2, baseY + 5);
    } else if (borderLocation === 3) {
      // west (north -> south)
      let y1 = baseY + (hasBorders.north ? 0 : !hasBorders.northwest ? 0 : 0);
      let y2 = baseY + 5 + (hasBorders.south ? 0 : !hasBorders.southwest ? 0 : 0);
      ctx.moveTo(baseX, y1);
      ctx.lineTo(baseX, y2);
    }
    ctx.stroke();
  },
  redrawSector(sector, canvas, x_s, y_s) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const CanvasOffset = 4;

    // Calculate sector bounds
    const sectorSize = this.mapOverlay.map.sectorSize;
    const minX = x_s;
    const maxX = x_s + sectorSize - 1;
    const minY = y_s;
    const maxY = y_s + sectorSize - 1;

    // Only process villages within this sector
    for (let y_c = minY; y_c <= maxY; y_c++) {
      for (let x_c = minX; x_c <= maxX; x_c++) {
        const coordsStr = x_c.toString().padStart(3, '0') + y_c.toString().padStart(3, '0');
        const village = this.clustersMap[coordsStr];
        if (!village) continue;

        // Fill the village tile with low opacity group color
        if (village.groupId) {
          const { baseX, baseY, width, height } = this.getTileBasePosition(x_s, y_s, x_c, y_c, CanvasOffset, CanvasOffset);
          ctx.fillStyle = this.groupsColors[village.groupId].replace(/,\s*[\d.]+\)$/, ', 0.1)');
          ctx.fillRect(baseX, baseY, width, height);
          if (village.isGroupVillage) this.paintGroupVillageIcon(ctx, village, x_s, y_s, x_c, y_c);
        }

        // Group border mask: neighbor has different groupId
        const hasBorders = {
          north:     village.groupId !== this.getGroupId(this.clustersMap, x_c, y_c - 1),
          east:      village.groupId !== this.getGroupId(this.clustersMap, x_c + 1, y_c),
          south:     village.groupId !== this.getGroupId(this.clustersMap, x_c, y_c + 1),
          west:      village.groupId !== this.getGroupId(this.clustersMap, x_c - 1, y_c),
          northeast: village.groupId !== this.getGroupId(this.clustersMap, x_c + 1, y_c - 1),
          northwest: village.groupId !== this.getGroupId(this.clustersMap, x_c - 1, y_c - 1),
          southeast: village.groupId !== this.getGroupId(this.clustersMap, x_c + 1, y_c + 1),
          southwest: village.groupId !== this.getGroupId(this.clustersMap, x_c - 1, y_c + 1)
        };

        // Ally border mask: same group, different allyId — only where no group border.
        // Guard: both sides must have a defined allyId to avoid undefined comparisons firing as true.
        const hasAllyBorders = {
          north:     !hasBorders.north     && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c, y_c - 1),
          east:      !hasBorders.east      && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c + 1, y_c),
          south:     !hasBorders.south     && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c, y_c + 1),
          west:      !hasBorders.west      && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c - 1, y_c),
          northeast: !hasBorders.northeast && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c + 1, y_c - 1),
          northwest: !hasBorders.northwest && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c - 1, y_c - 1),
          southeast: !hasBorders.southeast && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c + 1, y_c + 1),
          southwest: !hasBorders.southwest && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c - 1, y_c + 1)
        };

        // Player border mask: same group, same ally, different playerId — only where no group or ally border
        const hasPlayerBorders = {
          north:     !hasBorders.north     && !hasAllyBorders.north     && village.playerId !== this.getPlayerId(this.clustersMap, x_c, y_c - 1),
          east:      !hasBorders.east      && !hasAllyBorders.east      && village.playerId !== this.getPlayerId(this.clustersMap, x_c + 1, y_c),
          south:     !hasBorders.south     && !hasAllyBorders.south     && village.playerId !== this.getPlayerId(this.clustersMap, x_c, y_c + 1),
          west:      !hasBorders.west      && !hasAllyBorders.west      && village.playerId !== this.getPlayerId(this.clustersMap, x_c - 1, y_c),
          northeast: !hasBorders.northeast && !hasAllyBorders.northeast && village.playerId !== this.getPlayerId(this.clustersMap, x_c + 1, y_c - 1),
          northwest: !hasBorders.northwest && !hasAllyBorders.northwest && village.playerId !== this.getPlayerId(this.clustersMap, x_c - 1, y_c - 1),
          southeast: !hasBorders.southeast && !hasAllyBorders.southeast && village.playerId !== this.getPlayerId(this.clustersMap, x_c + 1, y_c + 1),
          southwest: !hasBorders.southwest && !hasAllyBorders.southwest && village.playerId !== this.getPlayerId(this.clustersMap, x_c - 1, y_c + 1)
        };

        const hardBorderColor  = this.groupsColors[village.groupId].replace(/,\s*[\d.]+\)$/, ', 1)');
        const lightBorderColor = this.groupsColors[village.groupId].replace(/,\s*[\d.]+\)$/, ', 0.4)');

        // Combined masks: higher-tier borders act as walls, preventing line overshoot into adjacent segments.
        const hasAllyOrGroupBorders = {
          north:     hasBorders.north     || hasAllyBorders.north,
          east:      hasBorders.east      || hasAllyBorders.east,
          south:     hasBorders.south     || hasAllyBorders.south,
          west:      hasBorders.west      || hasAllyBorders.west,
          northeast: hasBorders.northeast || hasAllyBorders.northeast,
          northwest: hasBorders.northwest || hasAllyBorders.northwest,
          southeast: hasBorders.southeast || hasAllyBorders.southeast,
          southwest: hasBorders.southwest || hasAllyBorders.southwest
        };
        const hasAnyBorders = {
          north:     hasAllyOrGroupBorders.north     || hasPlayerBorders.north,
          east:      hasAllyOrGroupBorders.east      || hasPlayerBorders.east,
          south:     hasAllyOrGroupBorders.south     || hasPlayerBorders.south,
          west:      hasAllyOrGroupBorders.west      || hasPlayerBorders.west,
          northeast: hasAllyOrGroupBorders.northeast || hasPlayerBorders.northeast,
          northwest: hasAllyOrGroupBorders.northwest || hasPlayerBorders.northwest,
          southeast: hasAllyOrGroupBorders.southeast || hasPlayerBorders.southeast,
          southwest: hasAllyOrGroupBorders.southwest || hasPlayerBorders.southwest
        };

        // Group + ally borders share the same color and cap mask, so their triggers merge into hasAllyOrGroupBorders
        if (hasAllyOrGroupBorders.north) this.paintBorders(x_s, y_s, x_c, y_c, hardBorderColor, canvas, 0, hasAllyOrGroupBorders);
        if (hasAllyOrGroupBorders.east)  this.paintBorders(x_s, y_s, x_c, y_c, hardBorderColor, canvas, 1, hasAllyOrGroupBorders);
        if (hasAllyOrGroupBorders.south) this.paintBorders(x_s, y_s, x_c, y_c, hardBorderColor, canvas, 2, hasAllyOrGroupBorders);
        if (hasAllyOrGroupBorders.west)  this.paintBorders(x_s, y_s, x_c, y_c, hardBorderColor, canvas, 3, hasAllyOrGroupBorders);

        // Player borders (light)
        if (hasPlayerBorders.north) this.paintBorders(x_s, y_s, x_c, y_c, lightBorderColor, canvas, 0, hasAnyBorders);
        if (hasPlayerBorders.east)  this.paintBorders(x_s, y_s, x_c, y_c, lightBorderColor, canvas, 1, hasAnyBorders);
        if (hasPlayerBorders.south) this.paintBorders(x_s, y_s, x_c, y_c, lightBorderColor, canvas, 2, hasAnyBorders);
        if (hasPlayerBorders.west)  this.paintBorders(x_s, y_s, x_c, y_c, lightBorderColor, canvas, 3, hasAnyBorders);
        
        if (village.hasOwnProperty('tempOwnershipLog')) {
          this.paintConquerIcon(ctx, village, x_s, y_s, x_c, y_c);
        }
      }
    }
  },
  redrawMiniSector(sector, canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Minimap uses 50x50 coordinate sectors
    const sectorSize = 50;
    const minX = sector.x;
    const maxX = sector.x + sectorSize - 1;
    const minY = sector.y;
    const maxY = sector.y + sectorSize - 1;

    // Only process villages within this sector
    for (let y_c = minY; y_c <= maxY; y_c++) {
      for (let x_c = minX; x_c <= maxX; x_c++) {
        const coordsStr = x_c.toString().padStart(3, '0') + y_c.toString().padStart(3, '0');
        const village = this.clustersMap[coordsStr];

        if (!village) continue;
        // Paint village square
        ctx.fillStyle = village.isGroupVillage ? this.groupsColors[village.groupId].replace(/,\s*[\d.]+\)$/, ', 1)') : this.groupsColors[village.groupId].replace(/,\s*[\d.]+\)$/, ', 0.5)');
        ctx.fillRect((x_c - sector.x) * 5 + 0.25, (y_c - sector.y) * 5 + 0.25, 4.5, 4.5);

        // Group border mask
        const hasBorders = {
          north:     village.groupId !== this.getGroupId(this.clustersMap, x_c, y_c - 1),
          east:      village.groupId !== this.getGroupId(this.clustersMap, x_c + 1, y_c),
          south:     village.groupId !== this.getGroupId(this.clustersMap, x_c, y_c + 1),
          west:      village.groupId !== this.getGroupId(this.clustersMap, x_c - 1, y_c),
          northeast: village.groupId !== this.getGroupId(this.clustersMap, x_c + 1, y_c - 1),
          northwest: village.groupId !== this.getGroupId(this.clustersMap, x_c - 1, y_c - 1),
          southeast: village.groupId !== this.getGroupId(this.clustersMap, x_c + 1, y_c + 1),
          southwest: village.groupId !== this.getGroupId(this.clustersMap, x_c - 1, y_c + 1)
        };

        // Ally border mask: same group, different allyId — only where no group border
        const hasAllyBorders = {
          north:     !hasBorders.north     && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c, y_c - 1),
          east:      !hasBorders.east      && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c + 1, y_c),
          south:     !hasBorders.south     && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c, y_c + 1),
          west:      !hasBorders.west      && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c - 1, y_c),
          northeast: !hasBorders.northeast && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c + 1, y_c - 1),
          northwest: !hasBorders.northwest && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c - 1, y_c - 1),
          southeast: !hasBorders.southeast && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c + 1, y_c + 1),
          southwest: !hasBorders.southwest && village.allyId !== undefined && village.allyId !== this.getAllyId(this.clustersMap, x_c - 1, y_c + 1)
        };

        // Player border mask: same group, same ally, different playerId
        const hasPlayerBorders = {
          north:     !hasBorders.north     && !hasAllyBorders.north     && village.playerId !== this.getPlayerId(this.clustersMap, x_c, y_c - 1),
          east:      !hasBorders.east      && !hasAllyBorders.east      && village.playerId !== this.getPlayerId(this.clustersMap, x_c + 1, y_c),
          south:     !hasBorders.south     && !hasAllyBorders.south     && village.playerId !== this.getPlayerId(this.clustersMap, x_c, y_c + 1),
          west:      !hasBorders.west      && !hasAllyBorders.west      && village.playerId !== this.getPlayerId(this.clustersMap, x_c - 1, y_c),
          northeast: !hasBorders.northeast && !hasAllyBorders.northeast && village.playerId !== this.getPlayerId(this.clustersMap, x_c + 1, y_c - 1),
          northwest: !hasBorders.northwest && !hasAllyBorders.northwest && village.playerId !== this.getPlayerId(this.clustersMap, x_c - 1, y_c - 1),
          southeast: !hasBorders.southeast && !hasAllyBorders.southeast && village.playerId !== this.getPlayerId(this.clustersMap, x_c + 1, y_c + 1),
          southwest: !hasBorders.southwest && !hasAllyBorders.southwest && village.playerId !== this.getPlayerId(this.clustersMap, x_c - 1, y_c + 1)
        };

        // 1. Draw group borders (hard, black)
        if (hasBorders.north) this.paintBorders_mini(sector, x_c, y_c, 'black', canvas, 0, hasBorders);
        if (hasBorders.east)  this.paintBorders_mini(sector, x_c, y_c, 'black', canvas, 1, hasBorders);
        if (hasBorders.south) this.paintBorders_mini(sector, x_c, y_c, 'black', canvas, 2, hasBorders);
        if (hasBorders.west)  this.paintBorders_mini(sector, x_c, y_c, 'black', canvas, 3, hasBorders);

        // 2. Draw ally borders (hard, black — same weight as group on minimap)
        if (hasAllyBorders.north) this.paintBorders_mini(sector, x_c, y_c, 'black', canvas, 0, hasAllyBorders);
        if (hasAllyBorders.east)  this.paintBorders_mini(sector, x_c, y_c, 'black', canvas, 1, hasAllyBorders);
        if (hasAllyBorders.south) this.paintBorders_mini(sector, x_c, y_c, 'black', canvas, 2, hasAllyBorders);
        if (hasAllyBorders.west)  this.paintBorders_mini(sector, x_c, y_c, 'black', canvas, 3, hasAllyBorders);

        // 3. Draw player borders (lighter)
        const playerBorderColor = 'rgba(40, 100, 35, 1)';
        if (hasPlayerBorders.north) this.paintBorders_mini(sector, x_c, y_c, playerBorderColor, canvas, 0, hasPlayerBorders);
        if (hasPlayerBorders.east)  this.paintBorders_mini(sector, x_c, y_c, playerBorderColor, canvas, 1, hasPlayerBorders);
        if (hasPlayerBorders.south) this.paintBorders_mini(sector, x_c, y_c, playerBorderColor, canvas, 2, hasPlayerBorders);
        if (hasPlayerBorders.west)  this.paintBorders_mini(sector, x_c, y_c, playerBorderColor, canvas, 3, hasPlayerBorders);
      }
    }
  },
  mapOverlay: typeof TWMap !== "undefined"  ? TWMap : null
};

if (typeof politicalMapReborn !== 'undefined') {
  politicalMapReborn.init();
} else {
  class PoliticalMapReborn {
    static PoliticalMapRebornTranslations() {
      return {
        en_US: {
          informationMessages: {
            loadingData: 'Loading data...',
            creatingAndPaintingClusters: 'Creating and painting clusters...',
            politicalMapRebornLoaded: 'Political Map Reborn Loaded.',
            fetchingGroups: 'Fetching groups...',
            fetchingGroupsInformation: 'Fetching groups information',
            fetchingLatestConquers: 'Fetching latest conquers...',
            groupCreatedSuccessfully: 'Group created successfully',
            groupUpdated: 'Group updated',
            groupRemoved: 'Group removed',
            playerAddedToGroup: 'Player added to group',
            playerRemovedFromGroup: 'Player removed from group',
            allyAddedToGroup: 'Ally added to group',
            allyRemovedFromGroup: 'Ally removed from group',
          },
          errors: {
            notMapScreen: 'You need to be on the map screen to run the Political Map Reborn.',
            noGroupsCreated: 'There are no groups created on Political Map Reborn.</br>Please create at least one group to run the map.',
            groupNameRequired: 'The group\'s name cannot be empty.',
            groupNameExists: 'Group name already exists',
            playerNameRequired: 'Player name is required',
            groupRequired: 'Group is required',
            groupNotFound: 'Group does not exist',
            playerAlreadyInGroup: 'Player already in a group',
            playerNotFound: 'Player does not exist',
            allyNameRequired: 'Ally name is required',
            allyAlreadyInGroup: 'Ally already in a group',
            allyNotFound: 'Ally does not exist'
          },
          groups: {
            editTitle: 'Edit Group',
            saveButton: 'Save Changes',
            deleteButton: 'Delete Group',
            confirmRemoveGroup: 'Are you sure you want to remove this group?',
            confirmRemovePlayer: 'Are you sure you want to remove this player from the group?',
            confirmRemoveAlly: 'Are you sure you want to remove this ally from the group?',
            addPlayerUI: {
              title: 'Add Player to a Group',
              player: 'Player',
              group: 'Group',
              button: 'Add Player'
            },
            addAllyUI: {
              title: 'Add Ally to a Group',
              ally: 'Ally',
              group: 'Group',
              button: 'Add Ally'
            },
            createGroupUI: {
              title: 'Create a Group',
              groupName: 'Group Name',
              color: 'Color',
              button: 'Create Group'
            },
          },
          tableHeaders: {
            group: 'Group',
            member: 'Member',
            remove: 'Remove'
          },
          legacyMap: {
            enableLegacyMap: 'Enable legacy Political Map',
            createClustersForAlliesOutsideGroups: 'Create clusters for allies outside of groups',
            premiumAccountTitle: 'Premium Account',
            premiumAccountHtml: 'A Premium Account is required to use Political Map Reborn\'s custom groups.',
            premiumAccountMissing: 'You have a Premium Account active and can therefore use Political Map Reborn\'s custom groups!',
            allies: 'Allies',
            enemies: 'Enemies',
            nonAggressionPact: 'Non-Aggression Pact'
          },
          settingsTitle: 'Political Map Reborn Settings',
          settingsLink: 'Political Map Reborn Settings',
          reloadButton: 'Reload Political Map Reborn',
          runPoliticalMapReborn: 'Run Political Map Reborn',
          credits: 'Political Map Reborn script v0.1.10 by NunoF-',
        },
        pt_PT: {
          informationMessages: {
            loadingData: 'A carregar dados...',
            creatingAndPaintingClusters: 'A criar e desenhar os clusters...',
            politicalMapRebornLoaded: 'Political Map Reborn carregado.',
            fetchingGroups: 'A carregar os grupos...',
            fetchingGroupsInformation: 'A carregar as informações dos grupos...',
            fetchingLatestConquers: 'A carregar as últimas conquistas...',
            groupCreatedSuccessfully: 'Grupo criado com sucesso',
            groupUpdated: 'Grupo atualizado',
            groupRemoved: 'Grupo removido',
            playerAddedToGroup: 'Jogador adicionado ao grupo',
            playerRemovedFromGroup: 'Jogador removido do grupo',
            allyAddedToGroup: 'Tribo adicionada ao grupo',
            allyRemovedFromGroup: 'Tribo removida do grupo',
          },
          errors: {
            notMapScreen: 'É apenas possível correr o Political Map Reborn no ecrã do mapa.',
            noGroupsCreated: 'Não existem grupos criados no Political Map Reborn.</br>Por favor, crie pelo menos um grupo para correr o mapa.',
            groupNameRequired: 'O nome do grupo não pode estar vazio.',
            groupNameExists: 'O nome do grupo já existe',
            playerNameRequired: 'O nome do jogador é obrigatório',
            groupRequired: 'O grupo é obrigatório',
            groupNotFound: 'O grupo não existe',
            playerAlreadyInGroup: 'O jogador já está em um grupo',
            playerNotFound: 'O jogador não existe',
            allyNameRequired: 'O nome da tribo é obrigatório',
            allyAlreadyInGroup: 'A tribo já está em um grupo',
            allyNotFound: 'A tribo não existe'
          },
          groups: {
            editTitle: 'Editar Grupo',
            saveButton: 'Salvar Alterações',
            deleteButton: 'Remover Grupo',
            confirmRemoveGroup: 'Tem certeza de que deseja remover este grupo?',
            confirmRemovePlayer: 'Tem certeza de que deseja remover este jogador do grupo?',
            confirmRemoveAlly: 'Tem certeza de que deseja remover esta tribo do grupo?',
            addPlayerUI: {
              title: 'Adicionar Jogador a um Grupo',
              player: 'Jogador',
              group: 'Grupo',
              button: 'Adicionar Jogador'
            },
            addAllyUI: {
              title: 'Adicionar Tribo a um Grupo',
              ally: 'Tribo',
              group: 'Grupo',
              button: 'Adicionar Tribo'
            },
            createGroupUI: {
              title: 'Criar um Grupo',
              groupName: 'Nome do Grupo',
              color: 'Cor',
              button: 'Criar Grupo'
            },
          },
          tableHeaders: {
            group: 'Grupo',
            member: 'Membro',
            remove: 'Remover'
          },
          legacyMap: {
            enableLegacyMap: 'Ativar Mapa Político Legacy',
            createClustersForAlliesOutsideGroups: 'Criar clusters para tribos fora de grupos',
            premiumAccountTitle: 'Conta Premium',
            premiumAccountHtml: 'É necessária uma Conta Premium para usar os grupos personalizados do Political Map Reborn.',
            premiumAccountMissing: 'Você tem uma Conta Premium ativa e, portanto, pode usar os grupos personalizados do Political Map Reborn!',
            allies: 'Aliados',
            enemies: 'Inimigos',
            nonAggressionPact: 'Pacto de Não Agressão'
          },
          settingsTitle: 'Configurações do Political Map Reborn',
          settingsLink: 'Configurações do Political Map Reborn',
          reloadButton: 'Recarregar Political Map Reborn',
          runPoliticalMapReborn: 'Executar Political Map Reborn',
          credits: 'Script Political Map Reborn v0.1.10 por NunoF-',
        },
      };
    }

    constructor() {
      var locale = game_data.locale === 'pt_BR' ? 'pt_PT' : game_data.locale;
      this.UserTranslation =
        locale in PoliticalMapReborn.PoliticalMapRebornTranslations()
          ? (this.UserTranslation = PoliticalMapReborn.PoliticalMapRebornTranslations()[locale])
          : PoliticalMapReborn.PoliticalMapRebornTranslations().en_US;

      this.alliesMapText = "alliesMapFromTwApi_" + game_data.world;
      this.playersMapText = "playersFromTwApi_" + game_data.world;
      this.villagesMapText = "villagesMapFromTwApi_" + game_data.world;
      this.mapBoundsText = "mapBounds_" + game_data.world;
      this.lastQueryToTwApiText = "lastQueryToTwApi_" + game_data.world;
      this.legacyPoliticalMapEnabledText = "legacyPoliticalMapEnabled_" + game_data.world;
      this.clustersForAlliesOutsideGroupsEnabledText = "clustersForAlliesOutsideGroupsEnabled_" + game_data.world;

      this.alliesMap =
        localStorage.getItem(this.alliesMapText) !== null
          ? JSON.parse(localStorage.getItem(this.alliesMapText))
          : {};
      this.playersMap =
        localStorage.getItem(this.playersMapText) !== null
          ? JSON.parse(localStorage.getItem(this.playersMapText))
          : {};
      const storedVillagesMap =
        localStorage.getItem(this.villagesMapText) !== null
          ? JSON.parse(localStorage.getItem(this.villagesMapText))
          : {};
      this.villagesMap =
        this.#decodeVillagesMap(storedVillagesMap);
      this.mapBounds =
        localStorage.getItem(this.mapBoundsText) !== null
            ? JSON.parse(localStorage.getItem(this.mapBoundsText))
          : {};

      this.legacyPoliticalMapEnabled =
        localStorage.getItem(this.legacyPoliticalMapEnabledText) !== null
            ? JSON.parse(localStorage.getItem(this.legacyPoliticalMapEnabledText))
          : game_data.features.Premium.active ? false : true; // Default to legacy map for non-premium users, as they can't create custom groups

      this.createClustersForAlliesOutsideGroups =
        localStorage.getItem(this.clustersForAlliesOutsideGroupsEnabledText) !== null
          ? JSON.parse(localStorage.getItem(this.clustersForAlliesOutsideGroupsEnabledText)) : true;
      
      this.politicalMapNamePrefix = "PoliticalMapReborn_";
      this.groups = {};
    }

    #syncClustersForAlliesOutsideGroups() {
      const groups = this.groups ?? {};

      const assignedAllies = new Set(
        Object.entries(groups)
          .filter(([groupName, group]) => groupName !== '0' && !group?.isAutoUnassignedAllies)
          .flatMap(([, group]) => Object.values(group?.allies ?? {}).map(String))
      );

      groups['-1'] = {
        color: 'rgb(156, 114, 69)',
        dataId: '_defaultGroup',
        players: {},
        allies: {},
        villages: {},
        isAutoUnassignedAllies: true
      };

      Object.entries(this.alliesMap ?? {}).forEach(([allyIdRaw, ally]) => {
        const allyId = String(allyIdRaw);
        if (allyId === '0' || assignedAllies.has(allyId)) return;
        groups['-1'].allies[ally?.tag ?? allyId] = allyId;
      });
    }

    #setTribelessAndNotSetTribeGroup(groups) {
      groups[0] = {
        'allies': { [0]: 0 },
        'color': 'rgb(156, 114, 69)',
        'dataId': "_" + 0,
        'players': {},
        'villages': {}
      };
    }

    getGroupLookup() {
      const playerToGroup = {};
      const allyToGroup = {};
      const groupToColor = {};

      Object.entries(this.groups ?? {}).forEach(([groupName, group]) => {
        if (groupName === '0') return;
        groupToColor[groupName] = group.color;
        Object.values(group.players ?? {}).forEach((playerId) => {
          playerToGroup[playerId] = groupName;
        });
        Object.values(group.allies ?? {}).forEach((allyId) => {
          allyToGroup[allyId] = groupName;
        });
      });

      const getPlayerGroup = (playerId) =>
        playerToGroup[playerId] ?? allyToGroup[this.playersMap[playerId]?.allyId] ?? '';

      return { playerToGroup, allyToGroup, groupToColor, getPlayerGroup };
    }

    async #fetchPoliticalMapRebornGroups() {
      return await this.#fetchMapGroups(false);
    }

    async #fetchMapGroups(ignorePoliticalMapRebornGroups = true) {
      UI.InfoMessage(this.UserTranslation.informationMessages.fetchingGroups, 20000);
      await this.#sleep(200);
      const requestdata = await this.#fetchPage(this.#generateUrl('map'));
      const parsedHtml = $(requestdata);
      var groups = {};
      const groupElements = parsedHtml.find('#village_colors #for_color_groups tr');
      for (let i = groupElements.length - 1; i >= 0; i--) {
        UI.InfoMessage(`${this.UserTranslation.informationMessages.fetchingGroupsInformation}</br>${groupElements.length - i}/${groupElements.length}`, 20000);
        const element = groupElements[i];
        var groupName = $(element).find('.group-label').text().trim();
        if (ignorePoliticalMapRebornGroups && groupName.startsWith(this.politicalMapNamePrefix)) continue;
        else if (!ignorePoliticalMapRebornGroups && !groupName.startsWith(this.politicalMapNamePrefix)) continue;
        
        var color = $(element).find('.color_picker_launcher');
        const dataId = $(element).attr('data-id');
        
        var players = {};
        var allies = {};
        var villages = {};
        if (dataId) {
          if (ignorePoliticalMapRebornGroups && !$(element).find(':checkbox').first().prop('checked')) continue; // Skip inactive groups
          await this.#fetchGroupData(dataId, 'colorgroup_get_players', (data) => {
            data.forEach(player => {
              if (player.id && player.name) players[player.name] = player.id;
            });
          });
          await this.#fetchGroupData(dataId, 'colorgroup_get_tribes', (data) => {
            data.forEach(ally => {
              if (ally.id && ally.tag) allies[ally.tag] = ally.id;
            });
          });
          await this.#fetchGroupData(dataId, 'colorgroup_get_villages', (data) => {
            data.forEach(village => {
              if (village.id) villages[village.id] = village.id;
            });
          });
        }
        var groupName = !ignorePoliticalMapRebornGroups ? groupName.substr(this.politicalMapNamePrefix.length) : groupName;
        groups[groupName] = {
          color: `rgb(${color.attr('data-r')}, ${color.attr('data-g')}, ${color.attr('data-b')})`,
          dataId: dataId,
          players: players,
          allies: allies,
          villages: villages
        }
      }
      this.#setTribelessAndNotSetTribeGroup(groups);
      return groups;
    }

    async #legacyPoliticalMapRebornGroups() {
      var groups = await this.#fetchMapGroups();
      $.each({ ...TWMap.allyRelations, [game_data.player.ally]: 'partner' }, (allyId, relation) => { 
          const relationObj = ({
            partner: {
              translation: this.UserTranslation.legacyMap.allies,
              color: 'rgb(0,160,244)',
            },
            enemy: {
              translation: this.UserTranslation.legacyMap.enemies,
              color: 'rgb(244,0,0)',
            },
            nap: {
              translation: this.UserTranslation.legacyMap.nonAggressionPact,
              color: 'rgb(128,0,128)',
            },
          }[relation]) ?? {
            translation: '_0',
            color: 'rgb(156, 114, 69)'
          };

          if (!groups[relationObj.translation]) {
            groups[relationObj.translation] = {
              'allies': { [allyId]: allyId },
              'color': relationObj.color,
              'dataId': "_" + relationObj.translation,
              'players': {}
            };
          } else {
            groups[relationObj.translation].allies[allyId] = allyId;
          }
      });
      this.#setTribelessAndNotSetTribeGroup(groups);
      return groups;
    }

    #isOnMapScreen() {
        return game_data.screen === 'map';
    }

    async init() {
      if (!this.#isOnMapScreen()) {
        UI.ErrorMessage(this.UserTranslation.errors.notMapScreen);
        setTimeout(() => {window.location.href = this.#generateUrl('map');}, 1500);
        return;
      }

      this.groups = !this.legacyPoliticalMapEnabled ? await this.#fetchPoliticalMapRebornGroups() : await this.#legacyPoliticalMapRebornGroups();
      if (this.createClustersForAlliesOutsideGroups) this.#syncClustersForAlliesOutsideGroups();
      this.initUI();
    }

    #generateUrl(screen, mode = null, extraParams = {}) {
      var url = `/game.php?village=${game_data.village.id}&screen=${screen}`;
      if (mode !== null) url += `&mode=${mode}`;

      $.each(extraParams, function (key, value) {
        url += `&${key}=${value}`;
      });
      if (game_data.player.sitter !== '0') url += '&t=' + game_data.player.id;
      return url;
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

    async #fetchPage(url) {
      var data = null;
      await $.get(url).done(function (data_temp) {
        data = data_temp;
      });
      return data;
    }

    #hexToRgb(hex) {
      const [r, g, b] = [hex.substr(1, 2), hex.substr(3, 2), hex.substr(5, 2)].map(v => parseInt(v, 16));
      return { r, g, b };
    }

    #rgbString(r, g, b) {
      return `rgb(${r}, ${g}, ${b})`;
    }

    async #ajaxPost(ajaxaction, postData) {
      await this.#sleep(200);
      const url = this.#generateUrl('map', null, { ajaxaction });
      return await $.ajax({
        url,
        type: 'POST',
        data: `${postData}&h=${game_data.csrf}`,
        contentType: 'application/x-www-form-urlencoded',
        dataType: 'json'
      });
    }

    async #sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async #fetchGroupData(dataId, ajaxaction, processor) {
      try {
        const data = await this.#ajaxPost(ajaxaction, `group_id=${encodeURIComponent(dataId)}`);
        if (Array.isArray(data)) {
          processor(data);
        }
      } catch (error) {
        console.error(`Failed to fetch ${ajaxaction}:`, error);
      }
    }

    async #findAndConfigureGroup(groupName, colorHex) {
      await this.#sleep(200);
      const mapHtml = await this.#fetchPage(this.#generateUrl('map'));
      const parsedHtml = $(mapHtml);
      const targetDiv = parsedHtml.find('#map_legend table .map_legend').filter((index, element) => {
        return $(element).find('span').text().trim() === this.politicalMapNamePrefix + groupName;
      });
      
      if (targetDiv.length === 0) {
        throw new Error('Group not found');
      }
      
      const dataId = targetDiv.attr('data-id');
      const { r, g, b } = this.#hexToRgb(colorHex);
      
      await this.#ajaxPost('colorgroup_active', `group_id=${encodeURIComponent(dataId)}&active=0`);
      await this.#ajaxPost('colorgroup_change_color', `group_id=${encodeURIComponent(dataId)}&r=${r}&g=${g}&b=${b}`);
      
      return dataId;
    }

    #decodeVillagesMap(storedVillagesMap) {
      if (!Array.isArray(storedVillagesMap)) return storedVillagesMap ?? {};

      const villagesMap = {};
      storedVillagesMap.forEach((row) => {
        if (!Array.isArray(row) || row.length < 5) return;

        const [id, x, y, allyId, playerId, tempOwnershipLog, showTempOwnershipLog, lastOwnershipTriggerGroup] = row;
        if (id === undefined || id === null) return;

        villagesMap[id] = {
          x,
          y,
          allyId,
          playerId,
          tempOwnershipLog: Array.isArray(tempOwnershipLog) ? tempOwnershipLog : [],
          showTempOwnershipLog: Boolean(showTempOwnershipLog),
          lastOwnershipTriggerGroup: lastOwnershipTriggerGroup ?? ''
        };
      });

      return villagesMap;
    }

    #encodeVillagesMap(villagesMap) {
      return Object.entries(villagesMap).map(([id, village]) => [
        id,
        village.x,
        village.y,
        village.allyId,
        village.playerId,
        village.tempOwnershipLog ?? [],
        village.showTempOwnershipLog ?? false,
        village.lastOwnershipTriggerGroup ?? ''
      ]);
    }

    async #updateTwApiAllies() {
      await this.#sleep(200);
      var fetchedPlayers = await this.#fetchPage('/map/ally.txt');
      var alliesMap = {};
      fetchedPlayers
        .trim()
        .split('\n')
        .forEach((line) => {
          const [allyId, name, tag] = line.split(',');
          alliesMap[allyId] = { name, tag };
        });
      localStorage.setItem(this.alliesMapText, JSON.stringify(alliesMap));
      this.alliesMap = alliesMap;
    }

    async #updateTwApiPlayers() {
      await this.#sleep(200);
      var fetchedPlayers = await this.#fetchPage('/map/player.txt');
      var playersMap = {};
      fetchedPlayers
        .trim()
        .split('\n')
        .forEach((line) => {
          const [playerId, playerName, allyId] = line.split(',');
          playersMap[playerId] = { playerName, allyId };
        });

      localStorage.setItem(this.playersMapText, JSON.stringify(playersMap));
      this.playersMap = playersMap;
    }

    async #updateTwApiVillages() {
      await this.#sleep(200);
      var fetchedWorldVillages = await this.#fetchPage('/map/village.txt');
      var villagesMap = {};
      var mapBounds = {
        smallestX: Infinity,
        biggestX: 0,
        smallestY: Infinity,
        biggestY: 0,
      };
      fetchedWorldVillages
        .trim()
        .split('\n')
        .forEach((line) => {
          const [id, , x, y, playerId] = line.split(',');
          if (Number(playerId) !== 0 && this.playersMap[playerId]?.allyId !== 0) {
            if (x < mapBounds.smallestX) mapBounds.smallestX = x;
            else if (x > mapBounds.biggestX) mapBounds.biggestX = x;

            if (y < mapBounds.smallestY) mapBounds.smallestY = y;
            else if (y > mapBounds.biggestY) mapBounds.biggestY = y;

            villagesMap[id] = { x, y, allyId: this.playersMap[playerId]?.allyId ?? 0, playerId: playerId, 
              tempOwnershipLog: [], showTempOwnershipLog: false, lastOwnershipTriggerGroup: '' };
          }
        });
      localStorage.setItem(this.mapBoundsText, JSON.stringify(mapBounds));
      this.mapBounds = mapBounds;
      localStorage.setItem(this.villagesMapText, JSON.stringify(this.#encodeVillagesMap(villagesMap)));
      this.villagesMap = villagesMap;
    }

    async #updateTwApiData() {
      await this.#updateTwApiAllies();
      await this.#updateTwApiPlayers();
      await this.#updateTwApiVillages();
      localStorage.setItem(this.lastQueryToTwApiText, Math.floor(Date.now() / 1000));
    }

    async #updateTwApiLatestConquers() {
      await this.#sleep(200);
      var fetchedWorldVillages = await this.#fetchPage(
        '/interface.php?func=get_conquer&since=' + Math.floor(Date.now() / 1000  + 60 - 24 * 60 * 60) // Added 60 seconds to avoid potential issues with the data no longer being avaliable due to more than 24 hours having passed.
      );
      const { getPlayerGroup } = this.getGroupLookup();

      fetchedWorldVillages
        .trim()
        .split('\n')
        .forEach((line) => {
          const [villageId, unixTimestamp, newOwner, oldOwner] = line.split(',');
          if (this.villagesMap.hasOwnProperty(villageId)) {
            this.villagesMap[villageId].playerId = newOwner;
            this.villagesMap[villageId].tempOwnershipLog.push({ unixTimestamp, oldOwner, newOwner });
            const oldGroup = getPlayerGroup(oldOwner);
            const newGroup = getPlayerGroup(newOwner);
            if (oldGroup && newGroup && oldGroup !== newGroup) {
              this.villagesMap[villageId].showTempOwnershipLog = true;
              this.villagesMap[villageId].lastOwnershipTriggerGroup = oldGroup;
            }
          }
        });
    }

    async runPoliticalMapReborn() {
      if (this.createClustersForAlliesOutsideGroups) this.#syncClustersForAlliesOutsideGroups();

      if (Object.keys(this.groups).length === 0) {
        UI.ErrorMessage(this.UserTranslation.errors.noGroupsCreated);
        return;
      }

      UI.InfoMessage(this.UserTranslation.informationMessages.creatingAndPaintingClusters);
      // Double rAF: first fires before paint, second fires after paint completes
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      var politicalMapRebornGroups = { players: {}, allies: {}, villages: {},groupsColors: {} };
      $.each(this.groups, (groupName, group) => {
        if (groupName === '-1' && !this.createClustersForAlliesOutsideGroups) return;
        $.each(group.players ?? {}, (_, playerId) => {
          politicalMapRebornGroups.players[playerId] = group.dataId;
        });
        $.each(group.allies ?? {}, (_, allyId) => {
          politicalMapRebornGroups.allies[allyId] = group.dataId;
        });
        $.each(group.villages ?? {}, (_, villageId) => {
          politicalMapRebornGroups.villages[villageId] = group.dataId;
        });
        const rgbaGroupColor = group.color.replace('rgb', 'rgba').replace(')', ', 0.3)');
        politicalMapRebornGroups.groupsColors[group.dataId] = rgbaGroupColor;
      });
      MapSdk.init(this.villagesMap, this.mapBounds, politicalMapRebornGroups);
      MapSdk.mapOverlay.reload();
      UI.SuccessMessage(this.UserTranslation.informationMessages.politicalMapRebornLoaded);
    }

    async initUI() {
      if ($('#politicalMapRebornSettings').length) {
        this.runPoliticalMapReborn();
        return;
      }
      
      UI.InfoMessage(this.UserTranslation.informationMessages.loadingData);
      var lastAPIVillageQuery = localStorage.getItem(this.lastQueryToTwApiText);
      if (
        lastAPIVillageQuery === null ||
        Number(localStorage.getItem(this.lastQueryToTwApiText)) + 60 * 60 < Date.now() / 1000
      ) {
        await this.#updateTwApiData();
      } // No need for else, already set to fetch in constructor

      UI.InfoMessage(this.UserTranslation.informationMessages.fetchingLatestConquers);

      // Update data with last conquers
      await this.#updateTwApiLatestConquers();

      // UI - Add Styles
      $(`<style>
        #politicalMapRebornSettings {
          background: rgb(228, 203, 152);
          border: 1px solid rgb(125, 81, 15);
          padding: 20px;
        }
        #politicalMapRebornSettings h2, .politicalMapRebornSettingsEditGroupModal h2 {
          text-align: center;
        }
        #politicalMapRebornSettings .gm-section, .politicalMapRebornSettingsEditGroupModal .gm-section {
          margin: 0 auto 13px auto;
          width: 275px;
        }
        #politicalMapRebornSettings .gm-section .premium-icon {
          width: 24px;
          float: right;
          padding: 2px 0px 0 0;
        }
        #politicalMapRebornSettings .gm-section .premium-icon.premium-icon-disabled {
          opacity: 0.3;
        }
        #politicalMapRebornSettings .gm-section .premium-icon:hover {
          opacity: 1;
        }
        #politicalMapRebornSettings .gm-flex, .politicalMapRebornSettingsEditGroupModal .gm-flex {
          display: flex;
          width: 100%;
          gap: 20px;
        }
        #politicalMapRebornSettings .gm-column, .politicalMapRebornSettingsEditGroupModal .gm-column {
          display: block;
          margin: 0 auto 13px auto;
        }
        #politicalMapRebornSettings .gm-table, .politicalMapRebornSettingsEditGroupModal .gm-table {
          width: 250px;
        }
        #politicalMapRebornSettings .gm-table-spaced, .politicalMapRebornSettingsEditGroupModal .gm-table-spaced {
          width: 250px;
          margin-bottom: 13px;
        }
        #politicalMapRebornSettings #player-color-select, .politicalMapRebornSettingsEditGroupModal #player-color-select {
          width: 250px;
          margin: 13px 0;
        }
        #politicalMapRebornSettings .gm-label, .politicalMapRebornSettingsEditGroupModal .gm-label {
          font-weight: bold;
        }
        #politicalMapRebornSettings .gm-th-wide, .politicalMapRebornSettingsEditGroupModal .gm-th-wide {
          width: 210px;
        }
        #politicalMapRebornSettings .gm-th-narrow, .politicalMapRebornSettingsEditGroupModal .gm-th-narrow {
          width: 50px;
        }
        #politicalMapRebornSettings .gm-btn-row, .politicalMapRebornSettingsEditGroupModal .gm-btn-row {
          background: none;
        }
        #politicalMapRebornSettings .gm-btn-right, .politicalMapRebornSettingsEditGroupModal .gm-btn-right {
          float: right;
        }
        .gm-settings-link {
          font-size: 15px;
        }
        .gm-reload-btn {
          font-size: 14px !important;
          padding: 8px;
          margin: 0 auto;
          display: block;
          width: min-content;
        }
        #politicalMapRebornSettings .gm-group-header-cell, .politicalMapRebornSettingsEditGroupModal .gm-group-header-cell {
          text-align: center;
          min-width: 55px;
        }
        #politicalMapRebornSettings .gm-edit-icon, .politicalMapRebornSettingsEditGroupModal .gm-edit-icon {
          cursor: pointer;
          margin-left: 5px;
        }
        #politicalMapRebornSettings .gm-remove-cell, .politicalMapRebornSettingsEditGroupModal .gm-remove-cell {
          position: relative;
        }
        #politicalMapRebornSettings .gm-remove-btn, .politicalMapRebornSettingsEditGroupModal .gm-remove-btn {
          background: url(/graphic/login_close.png) top left no-repeat;
          width: 20px;
          height: 20px;
          margin: 0 auto;
          cursor: pointer;
        }
      </style>`).appendTo('head');

      // UI - Create Settings Container
      $(`<div id="politicalMapRebornSettings">
  <h2>${this.UserTranslation.settingsTitle}</h2>

  <div class="gm-section">
    <img alt="" class="premium-icon premium_tooltip ${!game_data.features.Premium.active ? 'premium-icon-disabled' : ''}" src="https://yy1.tribalwars.vodka/graphic/premium/features/Premium_hint.png"
    data-title="<h3>${this.UserTranslation.legacyMap.premiumAccountTitle}</h3> :: ${!game_data.features.Premium.active ? this.UserTranslation.legacyMap.premiumAccountHtml : this.UserTranslation.legacyMap.premiumAccountMissing}">
    <table class="vis gm-table">
      <tbody>
        <tr>
          <td><input type="checkbox" onclick="politicalMapReborn.toggleLegacyMap(event)" ${this.legacyPoliticalMapEnabled || !game_data.features.Premium.active ? 'checked' : ''}></td>
          <th>${this.UserTranslation.legacyMap.enableLegacyMap}</th>
        </tr>
        <tr>
          <td><input type="checkbox" onclick="politicalMapReborn.toggleCreateClustersForAlliesOutsideGroups(event)" ${this.createClustersForAlliesOutsideGroups ? 'checked' : ''}></td>
          <th>${this.UserTranslation.legacyMap.createClustersForAlliesOutsideGroups}</th>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="gm-flex" id="politicalMapRebornCompleteOptions" ${this.legacyPoliticalMapEnabled || !game_data.features.Premium.active ? 'style="display:none;"' : ''}>
    <div class="gm-column">
     <table class="vis" id="player-color-select">
       <thead>
         <tr>
           <th>${this.UserTranslation.tableHeaders.group}</th>
           <th>${this.UserTranslation.tableHeaders.member}</th>
           <th class="gm-th-narrow">${this.UserTranslation.tableHeaders.remove}</th>
          </tr>
        </thead>
      <tbody></tbody>
      </table>
      <span class="gm-label">${this.UserTranslation.groups.createGroupUI.title}</span>
      <table class="vis gm-table-spaced">
        <tbody>
          <tr>
            <th class="gm-th-wide">${this.UserTranslation.groups.createGroupUI.groupName}</th>
            <td><input type="text" id="politicalMapRebornGroupName"></td>
          </tr>
          <tr>
            <th class="gm-th-wide">${this.UserTranslation.groups.createGroupUI.color}</th>
            <td><input type="color" id="politicalMapRebornGroupColor"></td>
          </tr>
          <tr>
            <td colspan="2" class="gm-btn-row">
              <a class="btn gm-btn-right" href="#" onclick="politicalMapReborn.addGroup(event)">${this.UserTranslation.groups.createGroupUI.button}</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="gm-column">

    <div class="gm-column">
      <span class="gm-label">${this.UserTranslation.groups.addAllyUI.title}</span>
      <table class="vis gm-table-spaced">
        <tbody>
          <tr>
            <th class="gm-th-wide">${this.UserTranslation.groups.addAllyUI.ally}</th>
            <td><input type="text" id="politicalMapRebornAllyName" data-type="ally" autocomplete="off" class="autocomplete ui-autocomplete-input"></td>
          </tr>
          <tr>
            <th class="gm-th-wide">${this.UserTranslation.groups.addAllyUI.group}</th>
            <td><select id="politicalMapRebornAllyGroupSelect"></select></td>
          </tr>
          <tr>
            <td colspan="2" class="gm-btn-row">
              <a class="btn gm-btn-right" href="#" onclick="politicalMapReborn.addAllyToGroup(event)">${this.UserTranslation.groups.addAllyUI.button}</a>
            </td>
          </tr>
        </tbody>
      </table>
      <span class="gm-label">${this.UserTranslation.groups.addPlayerUI.title}</span>
      <table class="vis gm-table-spaced">
        <tbody>
          <tr>
            <th class="gm-th-wide">${this.UserTranslation.groups.addPlayerUI.player}</th>
            <td><input type="text" id="politicalMapRebornPlayerName" data-type="player" autocomplete="off" class="autocomplete ui-autocomplete-input"></td>
          </tr>
          <tr>
            <th class="gm-th-wide">${this.UserTranslation.groups.addPlayerUI.group}</th>
            <td><select id="politicalMapRebornGroupSelect"></select></td>
          </tr>
          <tr>
            <td colspan="2" class="gm-btn-row">
              <a class="btn gm-btn-right" href="#" onclick="politicalMapReborn.addPlayerToGroup(event)">${this.UserTranslation.groups.addPlayerUI.button}</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="btn gm-reload-btn" onclick="politicalMapReborn.runPoliticalMapReborn()">${this.UserTranslation.reloadButton}</div>
  </div>
</div>`).insertAfter($("#continent_id").parent());

      // UI - Add Settings Button
      $(`<a class="gm-settings-link" href="#" onclick="politicalMapReborn.openSettings(event)">${this.UserTranslation.settingsLink}</a>`).insertAfter($("#continent_id").parent());

      // REMOVE BEFORE RELEASE
      $("#politicalMapRebornSettings").toggle();

      // UI - Add credits to the bottom of the map
      $(`<div style="background-image: url(https://dspt.innogamescdn.com/asset/2a2f957f/graphic/screen/tableheader_bg3.png);background-repeat: round;margin-bottom: 0px;border-radius: 0px 0 8px 8px;text-align: center;font-weight: bold;font-size: 13px;line-height: 1.7;">
          ${this.UserTranslation.credits}
        </div>`).insertAfter($("#map_whole"));

      // UI - Set tooltip to premium icon
      UI.ToolTip($(".premium_tooltip")) 

      // UI - Init UI for player/ally auto complete
      UI.init();
      
      this.runPoliticalMapReborn();
    }

    openSettings(e) {
      e.preventDefault();
      this.#refreshGroupsUI();
      $("#politicalMapRebornSettings").toggle();
    }

    // ==================== GROUPS (shared for players & allies) ====================

    #refreshGroupsUI() {      const updateGroupSelects = (selector) => {
        $(selector).empty();
        Object.keys(this.groups).forEach(name => {
          if (name === "0" || name === '-1') return;
          $(selector).append(`<option value="${name}">${name}</option>`);
        });
      };

      updateGroupSelects('#politicalMapRebornGroupSelect, #politicalMapRebornAllyGroupSelect');
      updateGroupSelects('#politicalMapRebornEditGroupSelect');

      // Refresh groups table (shows both players and allies)
      $('#player-color-select tbody').empty();
      Object.keys(this.groups).forEach(groupName => {
        if (groupName === "0" || groupName === '-1') return;
        const group = this.groups[groupName];
        const totalMembers = Object.keys(group.players).length + Object.keys(group.allies).length;
        
        $('#player-color-select tbody').append(`<tr>
          <td rowspan="${totalMembers + 1}" class="gm-group-header-cell">
            <span style="color: ${group.color}">${groupName}</span>
            <img src="https://dszz.innogamescdn.com/asset/11df8195/graphic/edit.png" class="gm-edit-icon" onclick="politicalMapReborn.openEditGroupModal(event, '${groupName}')">
          </td>
        </tr>`);
        
        Object.entries(group.players).forEach(([playerName]) => {
          $('#player-color-select tbody').append(`<tr><td class="gm-th-wide">${playerName} <i>(${this.UserTranslation.groups.addPlayerUI.player})</i></td><td class="gm-remove-cell"><div class="gm-remove-btn" onclick="politicalMapReborn.removePlayerFromGroup(event, '${groupName}', '${playerName}')"></div></td></tr>`);
        });
        
        Object.keys(group.allies).forEach(allyTag => {
          $('#player-color-select tbody').append(`<tr><td class="gm-th-wide">${allyTag} <i>(${this.UserTranslation.groups.addAllyUI.ally})</i></td><td class="gm-remove-cell"><div class="gm-remove-btn" onclick="politicalMapReborn.removeAllyFromGroup(event, '${groupName}', '${allyTag}')"></div></td></tr>`);
        });
      });
    }

    async toggleLegacyMap(e) {
      if (!game_data.features.Premium.active) {
        e.preventDefault();
        UI.ErrorMessage(this.UserTranslation.legacyMap.premiumAccountHtml);
        return;
      }
      this.legacyPoliticalMapEnabled = !this.legacyPoliticalMapEnabled;
      localStorage.setItem(this.legacyPoliticalMapEnabledText, this.legacyPoliticalMapEnabled);
      this.groups = !this.legacyPoliticalMapEnabled ? await this.#fetchPoliticalMapRebornGroups() : await this.#legacyPoliticalMapRebornGroups();
      if (this.createClustersForAlliesOutsideGroups) this.#syncClustersForAlliesOutsideGroups();
      $('#politicalMapRebornSettings .gm-flex').toggle();
      this.#refreshGroupsUI();
    }

    toggleCreateClustersForAlliesOutsideGroups(e) {
      this.createClustersForAlliesOutsideGroups = !this.createClustersForAlliesOutsideGroups;
      localStorage.setItem(this.clustersForAlliesOutsideGroupsEnabledText, this.createClustersForAlliesOutsideGroups);
      if (this.createClustersForAlliesOutsideGroups) this.#syncClustersForAlliesOutsideGroups();
      this.#refreshGroupsUI();
      this.runPoliticalMapReborn();
    }

    addGroup(e) {
      e.preventDefault();
      const groupName = $('#politicalMapRebornGroupName').val().trim();
      if (!groupName) return UI.ErrorMessage(this.UserTranslation.errors.groupNameRequired);
      if (this.groups[groupName]) return UI.ErrorMessage(this.UserTranslation.errors.groupNameExists);
      
      // Generate URL using generateUrl method
      const url = this.#generateUrl('map', null, { type: 'for', action: 'add_for_group' });
      
      // Prepare form data
      const formData = `new_group_name=${this.politicalMapNamePrefix}${encodeURIComponent(groupName)}&for_new_group=Create&h=${game_data.csrf}`;
      
      const hex = $('#politicalMapRebornGroupColor').val();
      const { r, g, b } = this.#hexToRgb(hex);
      const color = this.#rgbString(r, g, b);

      // Make POST request
      $.ajax({
        url: url,
        type: 'POST',
        data: formData,
        contentType: 'application/x-www-form-urlencoded',
        success: async () => {
          this.groups[groupName] = { color: color, players: {}, allies: {} };
          $('#politicalMapRebornGroupName').val('');
          $('#politicalMapRebornGroupColor').val('#000000');
          
          try {
            const dataId = await this.#findAndConfigureGroup(groupName, hex);
            this.groups[groupName].dataId = dataId;
            this.#refreshGroupsUI();
            UI.SuccessMessage(this.UserTranslation.informationMessages.groupCreatedSuccessfully);
          } catch (error) {
            console.error('Failed to configure group:', error);
            UI.ErrorMessage(this.UserTranslation.errors.failedToCreateGroup);
          }
        },
        error: () => {
          UI.ErrorMessage(this.UserTranslation.errors.failedToCreateGroup);
        }
      });
    }

    async editGroup(e, currentGroupName) {
      e.preventDefault();
      const newName = $('#politicalMapRebornEditGroupName').val().trim();
      const newColorHex = $('#politicalMapRebornEditGroupColor').val();
      
      if (!newName) return UI.ErrorMessage(this.UserTranslation.errors.groupNameRequired);
      
      const oldGroup = this.groups[currentGroupName];
      const { r, g, b } = this.#hexToRgb(newColorHex);
      const newColorRgb = this.#rgbString(r, g, b);
      
      if (newName !== currentGroupName) {
        // Check if new name already exists
        if (this.groups[newName]) return UI.ErrorMessage(this.UserTranslation.errors.groupNameExists);
        
        // Delete old group
        const dataId = oldGroup.dataId;
        await this.#ajaxPost('colorgroup_delete', `group_id=${encodeURIComponent(dataId)}`);
        
        // Create new group with new name and color
        const url = this.#generateUrl('map', null, { type: 'for', action: 'add_for_group' });
        const formData = `new_group_name=${this.politicalMapNamePrefix}${encodeURIComponent(newName)}&for_new_group=Create&h=${game_data.csrf}`;
        const { r: r2, g: g2, b: b2 } = this.#hexToRgb(newColorHex);
        const color = this.#rgbString(r2, g2, b2);
        
        await $.ajax({
          url: url,
          type: 'POST',
          data: formData,
          contentType: 'application/x-www-form-urlencoded'
        });
        
        try {
          const newDataId = await this.#findAndConfigureGroup(newName, newColorHex);
          
          // Add all players and allies to new group
          for (const [playerName, playerId] of Object.entries(oldGroup.players)) {
            await this.#ajaxPost('colorgroup_add_player', `group_id=${encodeURIComponent(newDataId)}&name=${encodeURIComponent(playerName)}`);
          }
          for (const [allyTag, allyId] of Object.entries(oldGroup.allies)) {
            await this.#ajaxPost('colorgroup_add_tribe', `group_id=${encodeURIComponent(newDataId)}&name=${encodeURIComponent(allyTag)}`);
          }
          
          // Update local
          this.groups[newName] = { color: color, dataId: newDataId, players: oldGroup.players, allies: oldGroup.allies };
          delete this.groups[currentGroupName];
        } catch (error) {
          console.error('Failed to configure new group:', error);
          UI.ErrorMessage(this.UserTranslation.errors.failedToCreateGroup);
          return;
        }
      } else if (newColorRgb !== oldGroup.color) {
        // Just change color
        const dataId = oldGroup.dataId;
        const { r: r3, g: g3, b: b3 } = this.#hexToRgb(newColorHex);
        await this.#ajaxPost('colorgroup_change_color', `group_id=${encodeURIComponent(dataId)}&r=${r3}&g=${g3}&b=${b3}`);
        this.groups[newName].color = this.#rgbString(r3, g3, b3);
      }
      
      this.#refreshGroupsUI();
      UI.SuccessMessage(this.UserTranslation.informationMessages.groupUpdated);
      Dialog.close(); // Close group edit modal
    }

    removeGroup(e, groupName) {
      e.preventDefault();
      UI.addConfirmBox(this.UserTranslation.groups.confirmRemoveGroup, async () => {
        const dataId = this.groups[groupName]?.dataId;
        if (dataId) {
          await this.#ajaxPost('colorgroup_delete', `group_id=${encodeURIComponent(dataId)}`);
        }
        delete this.groups[groupName];
        this.#refreshGroupsUI();
        UI.SuccessMessage(this.UserTranslation.informationMessages.groupRemoved);
        Dialog.close(); // Close group edit modal
      });
    }

    openEditGroupModal(e, groupName) {
      e.preventDefault();
      $('#politicalMapRebornEditGroupSelect').val(groupName);
      var html = `
      <div class="politicalMapRebornSettingsEditGroupModal">
        <span class="gm-label">${this.UserTranslation.groups.editTitle}</span>
        <table class="vis gm-table-spaced">
        <tbody>
          <tr>
            <th class="gm-th-wide">${this.UserTranslation.groups.createGroupUI.groupName}</th>
            <td><input type="text" id="politicalMapRebornEditGroupName" value="${groupName}"></td>
          </tr>
          <tr>
            <th class="gm-th-wide">${this.UserTranslation.groups.createGroupUI.color}</th>
            <td><input type="color" id="politicalMapRebornEditGroupColor" value="${this.groups[groupName].color}"></td>
          </tr>
          <tr>
            <td class="gm-btn-row">
              <a class="btn" href="#" onclick="politicalMapReborn.removeGroup(event, '${groupName}')">${this.UserTranslation.groups.deleteButton}</a>
            </td>
            <td colspan="2" class="gm-btn-row">
              <a class="btn gm-btn-right" href="#" onclick="politicalMapReborn.editGroup(event, '${groupName}')">${this.UserTranslation.groups.saveButton}</a>
            </td>
          </tr>
        </tbody>
        </table>
      </div>`;
      this.#createDialog('import', html, Dialog.close());
    }

    removePlayerFromGroup(e, groupName, playerName) {
      UI.addConfirmBox(this.UserTranslation.groups.confirmRemovePlayer, async () => {
        e.preventDefault();
        const playerId = this.groups[groupName].players[playerName];
        await this.#ajaxPost('colorgroup_del_player', `group_id=${encodeURIComponent(this.groups[groupName]?.dataId)}&id=${encodeURIComponent(playerId)}`);
        delete this.groups[groupName].players[playerName];
        this.#refreshGroupsUI();
        UI.SuccessMessage(this.UserTranslation.informationMessages.playerRemovedFromGroup);
      });
    }

    removeAllyFromGroup(e, groupName, allyName) {
      UI.addConfirmBox(this.UserTranslation.groups.confirmRemoveAlly, async () => {
        e.preventDefault();
        await this.#ajaxPost('colorgroup_del_tribe', `group_id=${encodeURIComponent(this.groups[groupName]?.dataId)}&id=${encodeURIComponent(this.groups[groupName].allies[allyName])}`);
        delete this.groups[groupName].allies[allyName];
        this.#refreshGroupsUI();
        UI.SuccessMessage(this.UserTranslation.informationMessages.allyRemovedFromGroup);
      });
    }

    async addPlayerToGroup(e) {
      e.preventDefault();
      const playerName = $('#politicalMapRebornPlayerName').val().trim();
      const selectedGroup = $('#politicalMapRebornGroupSelect').find('option:selected').val()?.trim();
      
      if (!playerName) return UI.ErrorMessage(this.UserTranslation.errors.playerNameRequired);
      if (!selectedGroup) return UI.ErrorMessage(this.UserTranslation.errors.groupRequired);
      if (!this.groups[selectedGroup]) return UI.ErrorMessage(this.UserTranslation.errors.groupNotFound);
      if (Object.values(this.groups).some(g => Object.keys(g.players).some(p => p.toLowerCase() === playerName.toLowerCase()))) {
        return UI.ErrorMessage(this.UserTranslation.errors.playerAlreadyInGroup);
      }

      let formatted = '';
      let playerId = null;
      const exists = Object.entries(this.playersMap).some(([id, p]) => {
        if (p.playerName.toLowerCase().replaceAll('+', ' ') === playerName.toLowerCase()) { 
          formatted = p.playerName.replaceAll('+', ' '); 
          playerId = id;
          return true; 
        }
        return false;
      });
      if (!exists) return UI.ErrorMessage(this.UserTranslation.errors.playerNotFound);

      // Add player to color group on server
      await this.#ajaxPost('colorgroup_add_player', `group_id=${encodeURIComponent(this.groups[selectedGroup]?.dataId)}&name=${encodeURIComponent(formatted)}`);

      this.groups[selectedGroup].players[formatted] = playerId;
      this.#refreshGroupsUI();
      $('#politicalMapRebornPlayerName').val('');
      $('#politicalMapRebornGroupSelect').val($('#politicalMapRebornGroupSelect option').first().val() ?? '');
      UI.SuccessMessage(this.UserTranslation.informationMessages.playerAddedToGroup);
    }

    async addAllyToGroup(e) {
      e.preventDefault();
      const allyName = $('#politicalMapRebornAllyName').val().trim();
      const selectedGroup = $('#politicalMapRebornAllyGroupSelect').find('option:selected').val()?.trim();
      
      if (!allyName) return UI.ErrorMessage(this.UserTranslation.errors.allyNameRequired);
      if (!selectedGroup) return UI.ErrorMessage(this.UserTranslation.errors.groupRequired);
      if (!this.groups[selectedGroup]) return UI.ErrorMessage(this.UserTranslation.errors.groupNotFound);
      if (Object.values(this.groups).some(g => Object.keys(g.allies).some(a => a.toLowerCase() === allyName.toLowerCase()))) 
        return UI.ErrorMessage(this.UserTranslation.errors.allyAlreadyInGroup);
      
      let formatted = '';
      let allyId = null;
      const exists = Object.entries(this.alliesMap).some(([id, a]) => {
        if (a.tag.toLowerCase() === allyName.toLowerCase() || a.name.toLowerCase() === allyName.toLowerCase()) { 
          formatted = a.tag; 
          allyId = id;
          return true; 
        }
        return false;
      });
      if (!exists) return UI.ErrorMessage(this.UserTranslation.errors.allyNotFound);

      // Add tribe to color group on server
      await this.#ajaxPost('colorgroup_add_tribe', `group_id=${encodeURIComponent(this.groups[selectedGroup]?.dataId)}&name=${encodeURIComponent(formatted)}`);

      this.groups[selectedGroup].allies[formatted] = allyId;
      this.#refreshGroupsUI();
      $('#politicalMapRebornAllyName').val('');
      $('#politicalMapRebornAllyGroupSelect').val($('#politicalMapRebornAllyGroupSelect option').first().val() ?? '');
      UI.SuccessMessage(this.UserTranslation.informationMessages.allyAddedToGroup);
    }
  }

  var politicalMapReborn = new PoliticalMapReborn();
  politicalMapReborn.init();
}
