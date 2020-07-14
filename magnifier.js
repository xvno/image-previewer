/**
 * 页面元素,
 * container[img, canvas], reset, clear, oasis
 */

let idxContainer = '#container',
    idxCanvas = '#canvas',
    idxAssistant = '#oasis',
    idxImg = '#target',
    idxClear = '#clear',
    idxReset = '#reset';

/**
 * 鼠标坐标
 * origin: mousedown的位置
 * start: 矩形左上角坐标
 * end: 矩形右下角坐标
 * x, y: 当前/mousemove的坐标
 */

let originX = 0,
    originY = 0,
    start = [],
    end = [],
    startX = 0,
    startY = 0,
    endX = 0,
    endY = 0,
    x = 0,
    y = 0;

/**
 * 选中部分的尺寸
 */
let width = 0,
    height = 0;

/**
 * canvas 相关
 */
let oasis; // 辅助 canvas, 暂存中转图像数据
let canvas; // 显示结果
let ctx; // 主 canvas 的 2dcontext
let clearBtn; // 清空canvas的button元素
let resetBtn; // 重置canvas, 即加载原图像的button元素

/**
 * img 相关组件
 */
let container; // 图像/canvas元素的容器
let tmp = new Image(); // 用于加载图像数据的Image对象
let img; // 页面上的img元素

/**
 * 指示框, 选中效果, Turquoise blue的颜色, 绿松石蓝
 * css class indicator, 给它基本的样式
 * css class inactive, 用来隐藏(鼠标非按下状态)
 */
let indicator = document.createElement('div');
indicator.classList.add('indicator');
indicator.classList.add('inactive');

/**
 * 页面加载事件...ready -> load
 */
document.onreadystatechange = function () {
    console.log('ready state changed!');
};

window.onload = function () {
    container = document.querySelector(idxContainer);
    container.appendChild(indicator); // TODO: 加载指示框, 有待改进, 如果是多图, 那么得动态加减

    canvas = document.querySelector(idxCanvas);
    ctx = canvas.getContext('2d');

    oasis = document.querySelector(idxAssistant);
    oasisCtx = oasis.getContext('2d');

    img = document.querySelector(idxImg);

    canvas.addEventListener('mousedown', handleMouse);
    canvas.addEventListener('mouseup', handleMouse);
    canvas.addEventListener('mousemove', handleMouse);

    clearBtn = document.querySelector(idxClear);
    clearBtn.onclick = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    resetBtn = document.querySelector(idxReset);
    resetBtn.onclick = imgOnload;

    tmp.src = img.src; // 加载图像资源
    tmp.onload = imgOnload();
};

/**
 * tmp缓存对象的图像加载完成后, 获取contain位置, 清空canvas, 并以contain的方式居中绘制
 * @param {MouseEvent}} e
 */
function imgOnload(e) {
    let pos = getContainPosition(
        [canvas.width, canvas.height],
        [tmp.width, tmp.height]
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tmp, pos[0], pos[1], pos[2], pos[3]);
}

/**
 * 分别处理鼠标的mousedown, mousemove, mouseup事件
 * @param {MouseEvnet} e
 */
function handleMouse(e) {
    let coordinates = -1;
    x = e.offsetX;
    y = e.offsetY;

    switch (e.type) {
        case 'mousedown':
            indicator.classList.remove('inactive');
            originX = x;
            originY = y;
            // css样式整体替换
            indicator.style.cssText = `
                left: ${originX}px;
                top: ${originY}px;
                width: 0px;
                height: 0px;
            `;

            break;

        case 'mousemove':
            coordinates = normalizeCoordinates([originX, originY], [x, y]);
            applyCoordinates(coordinates);

            // css样式整体替换
            indicator.style.cssText = `
                left: ${startX}px;
                top: ${startY}px;
                width: ${width}px;
                height: ${height}px;
            `;
            break;
        case 'mouseup':
            // 鼠标按键释放, 隐藏指示框
            indicator.classList.add('inactive');
            indicator.style.cssText = `left: 0px; top: 0px; width: 0px; height: 0px;`;
            coordinates = normalizeCoordinates([originX, originY], [x, y]);

            if (coordinates === -1) {
                wipes();
                return;
            }

            applyCoordinates(coordinates);
            operateImage(coordinates);
            break;
    }
}

/**
 *  根据正规化的起止坐标计算公共变量
 * @param {*} coordinates
 */
function applyCoordinates(coordinates) {
    start = coordinates[0];
    startX = start[0];
    startY = start[1];

    end = coordinates[1];
    endX = end[0];
    endY = end[1];

    width = endX - startX;
    height = endY - startY;
}

/**
 *
 * @param {[[x, y], [x, y]]} coordinates
 */
function operateImage(coordinates) {
    // get src image data
    let pos = getContainPosition(
        [canvas.width, canvas.height],
        [width, height]
    );
    // drawImage
    oasisCtx.clearRect(0, 0, oasis.width, oasis.height);
    oasisCtx.drawImage(
        canvas,
        startX,
        startY,
        width,
        height,
        pos[0],
        pos[1],
        pos[2],
        pos[3]
    );
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(oasis, 0, 0);
}

/**
 * 默认置空
 */
function wipes() {
    originX = originY = startX = startY = endX = endY = 0;
}

/**
 * 从小到大排序两数字
 * @param {Number} a
 * @param {Number} b
 */
function min(a, b) {
    return a > b ? [b, a] : [a, b];
}

/**
 * 正规化两个坐标, 转换为左上到右下的坐标
 * @param {Array of numbers: [x, y]} start
 * @param {Array of numbers: [x, y]} end
 */
function normalizeCoordinates(pointA, pointB) {
    // 鼠标事件不在限定区域内(图片范围内)
    if (pointA.indexOf(-1) > -1 || pointB.indexOf(-1) > -1) {
        return -1;
    }
    let xes = min(pointA[0], pointB[0]);
    let ys = min(pointA[1], pointB[1]);
    return [
        [xes[0], ys[0]],
        [xes[1], ys[1]],
    ];
}

/**
 * 关键算法
 * 图像以`contain`的形式显示, 用该函数获取绘图位置(dx, dy)和尺寸(width, height)
 * @param {2-Element Array of numbers: [width, height]} container
 * @param {2-Element Array of numbers: [width, height]} content
 * @returns {4-element Array of numbers: [dx, dx, width, height]}
 */

function getContainPosition(container, content) {
    let r = 1;
    // let lt = [0, 0]; // left-top destination position (dx, dy)
    let dx = 0;
    let dy = 0;
    let width = content[0];
    let height = content[1];

    if (container[0] * content[1] >= content[0] * container[1]) {
        r = container[1] / content[1];
        width = r * width;
        height = container[1];
        dx = (container[0] - width) >> 1;
        dy = 0;
    } else {
        r = container[0] / content[0];
        width = container[0];
        height = r * height;
        dx = 0;
        dy = (container[1] - height) >> 1;
    }
    return [dx, dy, width, height];
}
