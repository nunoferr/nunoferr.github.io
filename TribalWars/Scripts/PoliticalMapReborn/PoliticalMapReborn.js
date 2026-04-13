/*
 * Script Name: Political Map Reborn
 * Version: v0.1.3
 * Last Updated:
 * Author: NunoF-
 * Author URL: https://nunoferr.github.io/
 * Author Contact: Discord - ducks4ever
 * Special Thanks To:  Shinko to Kuma support during development, and Thomas "Sass" Ameye for making their MapSDK 
 *                     publicly available.
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

    if (this.mapOverlay.mapHandler._spawnSector) {
      //exists already, don't recreate
    } else {
      //doesn't exist yet
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
    this.groupsColors = politicalMapRebornGroups.groupsColors;
    this.mapOverlay.reload();
    return 'Initialised Map SDK';
  },
  // Helper to get ally_id at coordinate
  getGroupId(villages, x, y) {
    return villages[x.toString().padStart(3, '0') + y.toString().padStart(3, '0')]?.groupId;
  },
  // Helper to get player_id at coordinate
  getPlayerId(villages, x, y) {
    return villages[x.toString().padStart(3, '0') + y.toString().padStart(3, '0')]?.playerId;
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
        // but the player themselves were added to a group, we check player group first before tribe group.
        const groupId = politicalMapRebornGroups.players[village.playerId] ?? politicalMapRebornGroups.allies[village.allyId];

        if (groupId !== undefined) {
          const x = Number(village.x), y = Number(village.y);
          if (x < gridMinX) gridMinX = x;
          if (x > gridMaxX) gridMaxX = x;
          if (y < gridMinY) gridMinY = y;
          if (y > gridMaxY) gridMaxY = y;
          groupVillageEntries.push({ key, x, y, groupId, playerId: village.playerId });
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
    for (const { key, x, y, groupId, playerId } of groupVillageEntries) {
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
        result[key] = {
          groupId:  groupAssignments[ci]  === -1 ? undefined : groupIds[groupAssignments[ci]],
          playerId: playerAssignments[ci] === -1 ? undefined : playerIds[playerAssignments[ci]],
          isGroupVillage: villagesToGroupsCoords[key] || false
        };
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
          let pos = this.pixelByCoord(x_s, y_s, x_c, y_c);
          const halfScaleX = TWMap.map.scale[0] / 2;
          const halfScaleY = TWMap.map.scale[1] / 2;
          let baseX = pos[0] - halfScaleX + 4;
          let baseY = pos[1] - halfScaleY + 4;
          const W = TWMap.map.scale[0];
          const H = TWMap.map.scale[1];
          ctx.fillStyle = this.groupsColors[village.groupId].replace(/,\s*[\d.]+\)$/, ', 0.1)');
          ctx.fillRect(baseX, baseY, W, H);
        }

        // Check all 8 neighbors (cardinal + diagonal) FIRST to know which borders exist
        const hasBorders = {
          north: village.groupId !== this.getGroupId(this.clustersMap, x_c, y_c - 1),
          east: village.groupId !== this.getGroupId(this.clustersMap, x_c + 1, y_c),
          south: village.groupId !== this.getGroupId(this.clustersMap, x_c, y_c + 1),
          west: village.groupId !== this.getGroupId(this.clustersMap, x_c - 1, y_c),
          northeast: village.groupId !== this.getGroupId(this.clustersMap, x_c + 1, y_c - 1),
          northwest: village.groupId !== this.getGroupId(this.clustersMap, x_c - 1, y_c - 1),
          southeast: village.groupId !== this.getGroupId(this.clustersMap, x_c + 1, y_c + 1),
          southwest: village.groupId !== this.getGroupId(this.clustersMap, x_c - 1, y_c + 1)
        };

        // Check for player borders (lighter lines within same tribe)
        const hasPlayerBorders = {
          north: village.playerId !== this.getPlayerId(this.clustersMap, x_c, y_c - 1),
          east: village.playerId !== this.getPlayerId(this.clustersMap, x_c + 1, y_c),
          south: village.playerId !== this.getPlayerId(this.clustersMap, x_c, y_c + 1),
          west: village.playerId !== this.getPlayerId(this.clustersMap, x_c - 1, y_c),
          northeast: village.playerId !== this.getPlayerId(this.clustersMap, x_c + 1, y_c - 1),
          northwest: village.playerId !== this.getPlayerId(this.clustersMap, x_c - 1, y_c - 1),
          southeast: village.playerId !== this.getPlayerId(this.clustersMap, x_c + 1, y_c + 1),
          southwest: village.playerId !== this.getPlayerId(this.clustersMap, x_c - 1, y_c + 1)
        };

        const hardBorderColor =  this.groupsColors[village.groupId].replace(/,\s*[\d.]+\)$/, ', 1)');
        // Now draw borders with knowledge of which corners exist
        if (hasBorders.north)
          this.paintBorders(x_s, y_s, x_c, y_c, hardBorderColor, canvas, 0, hasBorders);
        if (hasBorders.east)
          this.paintBorders(x_s, y_s, x_c, y_c, hardBorderColor, canvas, 1, hasBorders);
        if (hasBorders.south)
          this.paintBorders(x_s, y_s, x_c, y_c, hardBorderColor , canvas, 2, hasBorders);
        if (hasBorders.west)
          this.paintBorders(x_s, y_s, x_c, y_c, hardBorderColor, canvas, 3, hasBorders);

        // Draw player borders (lighter, only where tribes are same)
        const lightBorderColor = this.groupsColors[village.groupId].replace(/,\s*[\d.]+\)$/, ', 0.4)');
        if (hasPlayerBorders.north && !hasBorders.north)
          this.paintBorders(x_s, y_s, x_c, y_c, lightBorderColor, canvas, 0, hasPlayerBorders);
        if (hasPlayerBorders.east && !hasBorders.east)
          this.paintBorders(x_s, y_s, x_c, y_c, lightBorderColor, canvas, 1, hasPlayerBorders);
        if (hasPlayerBorders.south && !hasBorders.south)
          this.paintBorders(x_s, y_s, x_c, y_c, lightBorderColor, canvas, 2, hasPlayerBorders);
        if (hasPlayerBorders.west && !hasBorders.west)
          this.paintBorders(x_s, y_s, x_c, y_c, lightBorderColor, canvas, 3, hasPlayerBorders);
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

        // Check all 8 neighbors (cardinal + diagonal) FIRST to know which borders exist
        const hasBorders = {
          north: village.groupId !== this.getGroupId(this.clustersMap, x_c, y_c - 1),
          east: village.groupId !== this.getGroupId(this.clustersMap, x_c + 1, y_c),
          south: village.groupId !== this.getGroupId(this.clustersMap, x_c, y_c + 1),
          west: village.groupId !== this.getGroupId(this.clustersMap, x_c - 1, y_c),
          northeast: village.groupId !== this.getGroupId(this.clustersMap, x_c + 1, y_c - 1),
          northwest: village.groupId !== this.getGroupId(this.clustersMap, x_c - 1, y_c - 1),
          southeast: village.groupId !== this.getGroupId(this.clustersMap, x_c + 1, y_c + 1),
          southwest: village.groupId !== this.getGroupId(this.clustersMap, x_c - 1, y_c + 1)
        };

        // Check for player borders (lighter lines within same tribe)
        const hasPlayerBorders = {
          north: village.playerId !== this.getPlayerId(this.clustersMap, x_c, y_c - 1),
          east: village.playerId !== this.getPlayerId(this.clustersMap, x_c + 1, y_c),
          south: village.playerId !== this.getPlayerId(this.clustersMap, x_c, y_c + 1),
          west: village.playerId !== this.getPlayerId(this.clustersMap, x_c - 1, y_c),
          northeast: village.playerId !== this.getPlayerId(this.clustersMap, x_c + 1, y_c - 1),
          northwest: village.playerId !== this.getPlayerId(this.clustersMap, x_c - 1, y_c - 1),
          southeast: village.playerId !== this.getPlayerId(this.clustersMap, x_c + 1, y_c + 1),
          southwest: village.playerId !== this.getPlayerId(this.clustersMap, x_c - 1, y_c + 1)
        };

        // Now draw borders with knowledge of which corners exist
        if (hasBorders.north)
          this.paintBorders_mini(sector, x_c, y_c, 'black', canvas, 0, hasBorders);
        if (hasBorders.east)
          this.paintBorders_mini(sector, x_c, y_c, 'black', canvas, 1, hasBorders);
        if (hasBorders.south)
          this.paintBorders_mini(sector, x_c, y_c, 'black', canvas, 2, hasBorders);
        if (hasBorders.west)
          this.paintBorders_mini(sector, x_c, y_c, 'black', canvas, 3, hasBorders);

        // Draw player borders (same color as cluster, very low opacity)
        const playerBorderColor = 'rgba(40, 100, 35, 1)';
        if (hasPlayerBorders.north && !hasBorders.north)
          this.paintBorders_mini(sector, x_c, y_c, playerBorderColor, canvas, 0, hasPlayerBorders);
        if (hasPlayerBorders.east && !hasBorders.east)
          this.paintBorders_mini(sector, x_c, y_c, playerBorderColor, canvas, 1, hasPlayerBorders);
        if (hasPlayerBorders.south && !hasBorders.south)
          this.paintBorders_mini(sector, x_c, y_c, playerBorderColor, canvas, 2, hasPlayerBorders);
        if (hasPlayerBorders.west && !hasBorders.west)
          this.paintBorders_mini(sector, x_c, y_c, playerBorderColor, canvas, 3, hasPlayerBorders);
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
          title: 'Incoming Tribe Attacks',
          total: 'Total',
          informationMessages: {
            loadingData: 'Loading data...',
            creatingAndPaintingClusters: 'Creating and painting clusters...',
            politicalMapRebornLoaded: 'Political Map Reborn Loaded.',
            fetchingGroups: 'Fetching political map reborn groups',
            fetchingLatestConquers: 'Fetching latest conquers...',
            groupCreatedSuccessfully: 'Group created successfully',
            groupUpdated: 'Group updated',
            groupRemoved: 'Group removed',
            playerAddedToGroup: 'Player added to group',
            playerRemovedFromGroup: 'Player removed from group',
            allyAddedToGroup: 'Ally added to group',
            allyRemovedFromGroup: 'Ally removed from group',
          },
          settings: {
            title: 'Political Map Reborn Settings'
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
            premiumAccountTitle: 'Premium Account',
            premiumAccountHtml: 'A Premium Account is required to use Political Map Reborn\'s custom groups.',
            premiumAccountMissing: 'You have a Premium Account active and can therefore use Political Map Reborn\'s custom groups!',
          },
          settingsTitle: 'Political Map Reborn Settings',
          settingsLink: 'Political Map Reborn Settings',
          reloadButton: 'Reload Political Map Reborn',
          runPoliticalMapReborn: 'Run Political Map Reborn',
          credits: 'Political Map Reborn script v0.1.3 by NunoF-',
        },
      };
    }

    constructor() {
      this.UserTranslation =
        game_data.locale in PoliticalMapReborn.PoliticalMapRebornTranslations()
          ? (this.UserTranslation = PoliticalMapReborn.PoliticalMapRebornTranslations()[game_data.locale])
          : PoliticalMapReborn.PoliticalMapRebornTranslations().en_US;
      this.UserTranslation = PoliticalMapReborn.PoliticalMapRebornTranslations().en_US;

      this.alliesMapText = "alliesMapFromTwApi_" + game_data.world;
      this.playersMapText = "playersFromTwApi_" + game_data.world;
      this.villagesMapText = "villagesMapFromTwApi_" + game_data.world;
      this.mapBoundsText = "mapBounds_" + game_data.world;
      this.lastQueryToTwApiText = "lastQueryToTwApi_" + game_data.world;
      this.legacyPoliticalMapEnabledText = "legacyPoliticalMapEnabled_" + game_data.world;

      this.alliesMap =
        localStorage.getItem(this.alliesMapText) !== null
          ? JSON.parse(localStorage.getItem(this.alliesMapText))
          : {};
      this.playersMap =
        localStorage.getItem(this.playersMapText) !== null
          ? JSON.parse(localStorage.getItem(this.playersMapText))
          : {};
      this.villagesMap =
        localStorage.getItem(this.villagesMapText) !== null
            ? JSON.parse(localStorage.getItem(this.villagesMapText))
          : {};
      this.mapBounds =
        localStorage.getItem(this.mapBoundsText) !== null
            ? JSON.parse(localStorage.getItem(this.mapBoundsText))
          : {};

      this.legacyPoliticalMapEnabled =
        localStorage.getItem(this.legacyPoliticalMapEnabledText) !== null
            ? JSON.parse(localStorage.getItem(this.legacyPoliticalMapEnabledText))
          : false;
      
      this.politicalMapNamePrefix = "PoliticalMapReborn_";
      this.groups = {};
    }

    #setTribelessAndNotSetTribeGroup(groups) {
      groups[0] = {
        'allies': { [0]: 0 },
        'color': 'rgb(156, 114, 69)',
        'dataId': "_" + 0,
        'players': {}
      };
    }

    async #fetchPoliticalMapRebornGroups() {
      UI.InfoMessage(this.UserTranslation.informationMessages.fetchingGroups);
      const requestdata = await this.#fetchPage(this.#generateUrl('map'));
      const parsedHtml = $(requestdata);
      var groups = {};
      const groupElements = parsedHtml.find('#village_colors #for_color_groups tr');
      for (let i = 0; i < groupElements.length; i++) {
        const element = groupElements[i];
        var groupName = $(element).find('.group-label').text().trim();
        if (groupName.startsWith(this.politicalMapNamePrefix)) {
          var color = $(element).find('.color_picker_launcher');
          const dataId = $(element).attr('data-id');
          
          var players = {};
          var allies = {};
          if (dataId) {
            try {
              const playersUrl = this.#generateUrl('map', null, { ajaxaction: 'colorgroup_get_players' });
              const playersData = await $.ajax({
                url: playersUrl,
                type: 'POST',
                data: `group_id=${encodeURIComponent(dataId)}&h=${game_data.csrf}`,
                contentType: 'application/x-www-form-urlencoded',
                dataType: 'json'
              });
              
              if (Array.isArray(playersData)) {
                playersData.forEach(player => {
                  if (player.id && player.name) players[player.name] = player.id;
                });
              }
            } catch (error) {
              console.error('Failed to fetch players for group:', error);
            }
            
            try {
              const alliesUrl = this.#generateUrl('map', null, { ajaxaction: 'colorgroup_get_tribes' });
              const alliesData = await $.ajax({
                url: alliesUrl,
                type: 'POST',
                data: `group_id=${encodeURIComponent(dataId)}&h=${game_data.csrf}`,
                contentType: 'application/x-www-form-urlencoded',
                dataType: 'json'
              });
              
              if (Array.isArray(alliesData)) {
                alliesData.forEach(ally => {
                  if (ally.id && ally.tag) allies[ally.tag] = ally.id;
                });
              }
            } catch (error) {
              console.error('Failed to fetch allies for group:', error);
            }
          }
          groups[groupName.substr(this.politicalMapNamePrefix.length)] = {
            color: `rgb(${color.attr('data-r')}, ${color.attr('data-g')}, ${color.attr('data-b')})`,
            dataId: dataId,
            players: players,
            allies: allies
          }
        }
      }
      this.#setTribelessAndNotSetTribeGroup(groups);
      return groups;
    }

    #legacyPoliticalMapRebornGroups() {
      var groups = {};
      $.each(TWMap.allyRelations, (allyId, relation) => { 
          groups[allyId] = {
            'allies': { [allyId]: allyId },
            'color': relation === 'partner' ? 'rgb(0,160,244)' : 'rgb(244,0,0)',
            'dataId': "_" + allyId,
            'players': {}
          };
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

      this.groups = !this.legacyPoliticalMapEnabled ? await this.#fetchPoliticalMapRebornGroups() : this.#legacyPoliticalMapRebornGroups();
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

    async #updateTwApiAllies() {
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

            villagesMap[id] = { x, y, allyId: this.playersMap[playerId]?.allyId ?? 0, playerId: playerId };
          }
        });
      localStorage.setItem(this.mapBoundsText, JSON.stringify(mapBounds));
      this.mapBounds = mapBounds;
      localStorage.setItem(this.villagesMapText, JSON.stringify(villagesMap));
      this.villagesMap = villagesMap;
    }

    async #updateTwApiData() {
      await this.#updateTwApiAllies();
      await this.#updateTwApiPlayers();
      await this.#updateTwApiVillages();
      localStorage.setItem(this.lastQueryToTwApiText, Math.floor(Date.now() / 1000));
    }

    async #updateTwApiLatestConquers() {
      var fetchedWorldVillages = await this.#fetchPage(
        '/interface.php?func=get_conquer&since=' + Math.floor(Date.now() / 1000 - 2 * 60 * 60)
      );
      fetchedWorldVillages
        .trim()
        .split('\n')
        .forEach((line) => {
          const [id, , newOwner] = line.split(',');
          if (this.villagesMap.hasOwnProperty(id)) [id].playerId = newOwner;
        });
    }

    async runPoliticalMapReborn() {
      if (Object.keys(this.groups).length === 0) {
        UI.ErrorMessage(this.UserTranslation.errors.noGroupsCreated);
        return;
      }

      UI.InfoMessage(this.UserTranslation.informationMessages.creatingAndPaintingClusters);
      // Double rAF: first fires before paint, second fires after paint completes
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      var politicalMapRebornGroups = { players: {}, allies: {}, groupsColors: {} };
      $.each(this.groups, (_, group) => {
        $.each(group.players ?? {}, (_, playerId) => {
          politicalMapRebornGroups.players[playerId] = group.dataId;
        });
        $.each(group.allies ?? {}, (_, allyId) => {
          politicalMapRebornGroups.allies[allyId] = group.dataId;
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
    data-title='<h3>${this.UserTranslation.legacyMap.premiumAccountTitle}</h3> :: ${!game_data.features.Premium.active ? this.UserTranslation.legacyMap.premiumAccountHtml : this.UserTranslation.legacyMap.premiumAccountMissing}'>
    <table class="vis gm-table">
      <tbody>
        <tr>
          <td><input type="checkbox" onclick="politicalMapReborn.toggleLegacyMap()" ${this.legacyPoliticalMapEnabled || !game_data.features.Premium.active ? 'checked' : ''}></td>
          <th>${this.UserTranslation.legacyMap.enableLegacyMap}</th>
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
  </div>
</div>
<div class="btn gm-reload-btn" onclick="politicalMapReborn.runPoliticalMapReborn()">${this.UserTranslation.reloadButton}</div>`).insertAfter($("#continent_id").parent());

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

    #refreshGroupsUI() {
      // Refresh both group selects
      $('#politicalMapRebornGroupSelect, #politicalMapRebornAllyGroupSelect').empty();
      Object.keys(this.groups).forEach(name => {
        if (name === "0") return; // Skip tribeless and not set tribe group since it doesn't have a real group in TW and can't be edited
        $('#politicalMapRebornGroupSelect, #politicalMapRebornAllyGroupSelect').append(`<option value="${name}">${name}</option>`);
      });

      // Refresh edit group select
      $('#politicalMapRebornEditGroupSelect').empty();
      Object.keys(this.groups).forEach(name => {
        if (name === "0") return; // Skip tribeless and not set tribe group since it doesn't have a real group in TW and can't be edited
        $('#politicalMapRebornEditGroupSelect').append(`<option value="${name}">${name}</option>`);
      });

      // Refresh groups table (shows both players and allies)
      $('#player-color-select tbody').empty();
      Object.keys(this.groups).forEach(groupName => {
        if (groupName === "0") return; // Skip tribeless and not set tribe group since it doesn't have a real group in TW and can't be edited
        const group = this.groups[groupName];
        const totalMembers = Object.keys(group.players).length + Object.keys(group.allies).length;
        $('#player-color-select tbody').append(`<tr>
          <td rowspan="${totalMembers + 1}" class="gm-group-header-cell">
            <span style="color: ${group.color}">${groupName}</span>
            <img src="https://dszz.innogamescdn.com/asset/11df8195/graphic/edit.png" class="gm-edit-icon" onclick="politicalMapReborn.openEditGroupModal(event, '${groupName}')">
          </td>
        </tr>`);
        Object.entries(group.players).forEach(([playerName, playerId]) => {
          $('#player-color-select tbody').append(`<tr><td class="gm-th-wide">${playerName} <i>(player)</i></td><td class="gm-remove-cell">
            <div class="gm-remove-btn" onclick="politicalMapReborn.removePlayerFromGroup(event, '${groupName}', '${playerName}')"></div>
          </td></tr>`);
        });
        Object.keys(group.allies).forEach(allyTag => {
          $('#player-color-select tbody').append(`<tr><td class="gm-th-wide">${allyTag} <i>(ally)</i></td><td class="gm-remove-cell">
            <div class="gm-remove-btn" onclick="politicalMapReborn.removeAllyFromGroup(event, '${groupName}', '${allyTag}')"></div>
          </td></tr>`);
        });
      });
    }

    async toggleLegacyMap() {
      if (!game_data.features.Premium.active) {
        UI.ErrorMessage(this.UserTranslation.legacyMap.premiumAccountHtml);
        return;
      }
      this.legacyPoliticalMapEnabled = !this.legacyPoliticalMapEnabled;
      localStorage.setItem(this.legacyPoliticalMapEnabledText, this.legacyPoliticalMapEnabled);
      this.groups = !this.legacyPoliticalMapEnabled ? await this.#fetchPoliticalMapRebornGroups() : this.#legacyPoliticalMapRebornGroups();
      $('#politicalMapRebornSettings .gm-flex').toggle();
      this.#refreshGroupsUI();
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
      const [r, g, b] = [hex.substr(1, 2), hex.substr(3, 2), hex.substr(5, 2)].map(v => parseInt(v, 16));
      const color = `rgb(${r}, ${g}, ${b})`;

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
          
          // Fetch map page in background to get the data-id
          try {
            const mapHtml = await this.#fetchPage(this.#generateUrl('map'));
            
            // Parse the HTML and find the div with the group name
            const parsedHtml = $(mapHtml);
            const targetDiv = parsedHtml.find('#map_legend table .map_legend').filter((index, element) => {
              return $(element).find('span').text().trim() === this.politicalMapNamePrefix + groupName;
            });
            
            if (targetDiv.length === 0) {
              UI.ErrorMessage(this.UserTranslation.errors.groupNotFound);
              return;
            }
            
            const dataId = targetDiv.attr('data-id');
            this.groups[groupName].dataId = dataId;
            
            // Submit request to set group as inactive
            const colorGroupUrl = this.#generateUrl('map', null, { ajaxaction: 'colorgroup_active' });
            const colorGroupFormData = `group_id=${encodeURIComponent(dataId)}&active=0&h=${game_data.csrf}`;
            await $.ajax({
              url: colorGroupUrl,
              type: 'POST',
              data: colorGroupFormData,
              contentType: 'application/x-www-form-urlencoded'
            });
            
            const rgb = this.groups[groupName].color;
            var [r, g, b] = rgb.match(/\d+/g).map(Number);
            await $.ajax({
              url: this.#generateUrl('map', null, { ajaxaction: 'colorgroup_change_color' }),
              type: 'POST',
              data: `group_id=${encodeURIComponent(dataId)}&r=${r}&g=${g}&b=${b}&h=${game_data.csrf}`,
              contentType: 'application/x-www-form-urlencoded'
            });
            
            this.#refreshGroupsUI();
            UI.SuccessMessage(this.UserTranslation.informationMessages.groupCreatedSuccessfully);
          } catch (error) {
            console.error('Failed to fetch map page for data-id:', error);
            UI.ErrorMessage(this.UserTranslation.errors.failedToCreateGroup);
            return;
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
      const [r, g, b] = [newColorHex.substr(1, 2), newColorHex.substr(3, 2), newColorHex.substr(5, 2)].map(v => parseInt(v, 16));
      const newColorRgb = `rgb(${r}, ${g}, ${b})`;
      
      if (newName !== currentGroupName) {
        // Check if new name already exists
        if (this.groups[newName]) return UI.ErrorMessage(this.UserTranslation.errors.groupNameExists);
        
        // Delete old group
        const dataId = oldGroup.dataId;
        await $.ajax({
          url: this.#generateUrl('map', null, { ajaxaction: 'colorgroup_delete' }),
          type: 'POST',
          data: `group_id=${encodeURIComponent(dataId)}&h=${game_data.csrf}`,
          contentType: 'application/x-www-form-urlencoded'
        });
        
        // Create new group with new name and color
        const url = this.#generateUrl('map', null, { type: 'for', action: 'add_for_group' });
        const formData = `new_group_name=${this.politicalMapNamePrefix}${encodeURIComponent(newName)}&for_new_group=Create&h=${game_data.csrf}`;
        const [r, g, b] = [newColorHex.substr(1, 2), newColorHex.substr(3, 2), newColorHex.substr(5, 2)].map(v => parseInt(v, 16));
        const color = `rgb(${r}, ${g}, ${b})`;
        
        await $.ajax({
          url: url,
          type: 'POST',
          data: formData,
          contentType: 'application/x-www-form-urlencoded'
        });
        
        // Fetch new dataId
        const mapHtml = await this.#fetchPage(this.#generateUrl('map'));
        const parsedHtml = $(mapHtml);
        const targetDiv = parsedHtml.find('#map_legend table .map_legend').filter((index, element) => {
          return $(element).find('span').text().trim() === this.politicalMapNamePrefix + newName;
        });
        const newDataId = targetDiv.attr('data-id');
        
        // Set inactive
        const colorGroupUrl = this.#generateUrl('map', null, { ajaxaction: 'colorgroup_active' });
        const colorGroupFormData = `group_id=${encodeURIComponent(newDataId)}&active=0&h=${game_data.csrf}`;
        await $.ajax({
          url: colorGroupUrl,
          type: 'POST',
          data: colorGroupFormData,
          contentType: 'application/x-www-form-urlencoded'
        });
        
        // Set color
        await $.ajax({
          url: this.#generateUrl('map', null, { ajaxaction: 'colorgroup_change_color' }),
          type: 'POST',
          data: `group_id=${encodeURIComponent(newDataId)}&r=${r}&g=${g}&b=${b}&h=${game_data.csrf}`,
          contentType: 'application/x-www-form-urlencoded'
        });
        
        // Add all players and allies to new group
        for (const [playerName, playerId] of Object.entries(oldGroup.players)) {
          await $.ajax({
            url: this.#generateUrl('map', null, { ajaxaction: 'colorgroup_add_player' }),
            type: 'POST',
            data: `group_id=${encodeURIComponent(newDataId)}&name=${encodeURIComponent(playerName)}&h=${game_data.csrf}`,
            contentType: 'application/x-www-form-urlencoded'
          });
        }
        for (const [allyTag, allyId] of Object.entries(oldGroup.allies)) {
          await $.ajax({
            url: this.#generateUrl('map', null, { ajaxaction: 'colorgroup_add_tribe' }),
            type: 'POST',
            data: `group_id=${encodeURIComponent(newDataId)}&name=${encodeURIComponent(allyTag)}&h=${game_data.csrf}`,
            contentType: 'application/x-www-form-urlencoded'
          });
        }
        
        // Update local
        this.groups[newName] = { color: color, dataId: newDataId, players: oldGroup.players, allies: oldGroup.allies };
        delete this.groups[currentGroupName];
      } else if (newColorRgb !== oldGroup.color) {
        // Just change color
        const dataId = oldGroup.dataId;
        const [r, g, b] = [newColorHex.substr(1, 2), newColorHex.substr(3, 2), newColorHex.substr(5, 2)].map(v => parseInt(v, 16));
        await $.ajax({
          url: this.#generateUrl('map', null, { ajaxaction: 'colorgroup_change_color' }),
          type: 'POST',
          data: `group_id=${encodeURIComponent(dataId)}&r=${r}&g=${g}&b=${b}&h=${game_data.csrf}`,
          contentType: 'application/x-www-form-urlencoded'
        });
        this.groups[newName].color = `rgb(${r}, ${g}, ${b})`;
      }
      
      this.#refreshGroupsUI();
      UI.SuccessMessage(this.UserTranslation.informationMessages.groupUpdated);
    }

    removeGroup(e, groupName) {
      e.preventDefault();
      UI.addConfirmBox(this.UserTranslation.groups.confirmRemoveGroup, async () => {
        const dataId = this.groups[groupName]?.dataId;
        if (dataId) {
          await $.ajax({
            url: this.#generateUrl('map', null, { ajaxaction: 'colorgroup_delete' }),
            type: 'POST',
            data: `group_id=${encodeURIComponent(dataId)}&h=${game_data.csrf}`,
            contentType: 'application/x-www-form-urlencoded'
          });
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
        
        // Get playerId from map
        const playerId = this.groups[groupName].players[playerName];
        
        // Remove player from color group on server
        await $.ajax({
          url: this.#generateUrl('map', null, { ajaxaction: 'colorgroup_del_player' }),
          type: 'POST',
          data: `group_id=${encodeURIComponent(this.groups[groupName]?.dataId)}&id=${encodeURIComponent(playerId)}&h=${game_data.csrf}`,
          contentType: 'application/x-www-form-urlencoded'
        });
        
        delete this.groups[groupName].players[playerName];
        this.#refreshGroupsUI();
        UI.SuccessMessage(this.UserTranslation.informationMessages.playerRemovedFromGroup);
      });
    }

    removeAllyFromGroup(e, groupName, allyName) {
      UI.addConfirmBox(this.UserTranslation.groups.confirmRemoveAlly, async () => {
        e.preventDefault();
        
        // Remove ally from color group on server
        await $.ajax({
          url: this.#generateUrl('map', null, { ajaxaction: 'colorgroup_del_tribe' }),
          type: 'POST',
          data: `group_id=${encodeURIComponent(this.groups[groupName]?.dataId)}&id=${encodeURIComponent(this.groups[groupName].allies[allyName])}&h=${game_data.csrf}`,
          contentType: 'application/x-www-form-urlencoded'
        });
        
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
      await $.ajax({
        url: this.#generateUrl('map', null, { ajaxaction: 'colorgroup_add_player' }),
        type: 'POST',
        data: `group_id=${encodeURIComponent(this.groups[selectedGroup]?.dataId)}&name=${encodeURIComponent(formatted)}&h=${game_data.csrf}`,
        contentType: 'application/x-www-form-urlencoded'
      });

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
      await $.ajax({
        url: this.#generateUrl('map', null, { ajaxaction: 'colorgroup_add_tribe' }),
        type: 'POST',
        data: `group_id=${encodeURIComponent(this.groups[selectedGroup]?.dataId)}&name=${encodeURIComponent(formatted)}&h=${game_data.csrf}`,
        contentType: 'application/x-www-form-urlencoded'
      });

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
