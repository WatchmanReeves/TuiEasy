export function getLinePoints(x0: number, y0: number, x1: number, y1: number) {
  const points = [];
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = (x0 < x1) ? 1 : -1;
  let sy = (y0 < y1) ? 1 : -1;
  let err = dx - dy;

  let cx = x0;
  let cy = y0;

  while(true) {
    points.push({x: cx, y: cy});
    if ((cx === x1) && (cy === y1)) break;
    let e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }
  return points;
}

export function snapLine(x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const angle = Math.atan2(dy, dx);
  const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  
  let nx = x0;
  let ny = y0;
  
  const deg = Math.round(snappedAngle * 180 / Math.PI);
  if (deg === 0 || deg === 180 || deg === -180) {
    nx = x1;
    ny = y0;
  } else if (deg === 90 || deg === -90) {
    nx = x0;
    ny = y1;
  } else {
    const dist = Math.min(Math.abs(dx), Math.abs(dy));
    nx = x0 + Math.sign(dx) * dist;
    ny = y0 + Math.sign(dy) * dist;
  }
  return { x: nx, y: ny };
}

export function getRectPoints(x0: number, y0: number, x1: number, y1: number, fill: boolean, shiftKey: boolean, ctrlKey: boolean) {
  let dx = x1 - x0;
  let dy = y1 - y0;

  if (shiftKey) {
    const maxDist = Math.max(Math.abs(dx), Math.abs(dy));
    dx = Math.sign(dx) * maxDist;
    dy = Math.sign(dy) * maxDist;
  }

  let minX, maxX, minY, maxY;

  if (ctrlKey) {
    minX = x0 - Math.abs(dx);
    maxX = x0 + Math.abs(dx);
    minY = y0 - Math.abs(dy);
    maxY = y0 + Math.abs(dy);
  } else {
    minX = Math.min(x0, x0 + dx);
    maxX = Math.max(x0, x0 + dx);
    minY = Math.min(y0, y0 + dy);
    maxY = Math.max(y0, y0 + dy);
  }

  const points = [];
  if (fill) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        points.push({x, y});
      }
    }
  } else {
    for (let x = minX; x <= maxX; x++) {
      points.push({x, y: minY});
      points.push({x, y: maxY});
    }
    for (let y = minY + 1; y < maxY; y++) {
      points.push({x: minX, y});
      points.push({x: maxX, y});
    }
  }
  return points;
}

export function getSmartRectPoints(x0: number, y0: number, x1: number, y1: number, fill: boolean, shiftKey: boolean, ctrlKey: boolean, fg: string, bg: string) {
  let dx = x1 - x0;
  let dy = y1 - y0;

  if (shiftKey) {
    const maxDist = Math.max(Math.abs(dx), Math.abs(dy));
    dx = Math.sign(dx) * maxDist;
    dy = Math.sign(dy) * maxDist;
  }

  let minX, maxX, minY, maxY;

  if (ctrlKey) {
    minX = x0 - Math.abs(dx);
    maxX = x0 + Math.abs(dx);
    minY = y0 - Math.abs(dy);
    maxY = y0 + Math.abs(dy);
  } else {
    minX = Math.min(x0, x0 + dx);
    maxX = Math.max(x0, x0 + dx);
    minY = Math.min(y0, y0 + dy);
    maxY = Math.max(y0, y0 + dy);
  }

  const points = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      let char = ' ';
      let isBorder = false;
      
      if (x === minX && y === minY) { char = '┌'; isBorder = true; }
      else if (x === maxX && y === minY) { char = '┐'; isBorder = true; }
      else if (x === minX && y === maxY) { char = '└'; isBorder = true; }
      else if (x === maxX && y === maxY) { char = '┘'; isBorder = true; }
      else if (x === minX || x === maxX) { char = '│'; isBorder = true; }
      else if (y === minY || y === maxY) { char = '─'; isBorder = true; }
      
      if (isBorder) {
        points.push({x, y, char, fg, bg});
      } else if (fill) {
        points.push({x, y, char: ' ', fg, bg});
      }
    }
  }
  return points;
}
