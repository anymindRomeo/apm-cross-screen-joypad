document.addEventListener('DOMContentLoaded', () => {
    // Parse roomId from URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');

    // Inject Arcade Controller CSS
    const style = document.createElement('style');
    style.innerHTML = `
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #222; display: flex; flex-direction: column; align-items: center; justify-content: center; touch-action: manipulation; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .brand { font-size: 20px; color: #f1c40f; margin-bottom: 40px; text-transform: uppercase; letter-spacing: 4px; font-weight: bold; text-shadow: 0 0 10px rgba(241, 196, 15, 0.5); }
        
        #controls-container { display: flex; flex-direction: column; align-items: center; gap: 40px; width: 100%; padding: 20px; box-sizing: border-box; }
        .row { display: flex; gap: 30px; width: 100%; justify-content: center; }
        
        /* Arcade Buttons Styling */
        button { flex: 1; max-width: 130px; height: 130px; font-size: 36px; font-weight: bold; border-radius: 50%; border: 8px solid #d35400; background: #f1c40f; color: #d35400; box-shadow: 0 12px 0 #a04000, 0 20px 20px rgba(0,0,0,0.6); user-select: none; -webkit-tap-highlight-color: transparent; transition: transform 0.1s, box-shadow 0.1s; display: flex; align-items: center; justify-content: center; }
        button:active { transform: translateY(12px); box-shadow: 0 0 0 #a04000, 0 8px 10px rgba(0,0,0,0.6); background: #f39c12; }
        
        #btn-drop { background: #e74c3c; border-color: #c0392b; color: #fff; box-shadow: 0 12px 0 #922b21, 0 20px 20px rgba(0,0,0,0.6); width: 180px; max-width: 180px; height: 180px; font-size: 40px; }
        #btn-drop:active { box-shadow: 0 0 0 #922b21, 0 8px 10px rgba(0,0,0,0.6); transform: translateY(12px); background: #c0392b; }
        
        #message-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #222; color: #f1c40f; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; text-align: center; padding: 30px; box-sizing: border-box; z-index: 100; }
    `;
    document.head.appendChild(style);

    const messageOverlay = document.createElement('div');
    messageOverlay.id = 'message-overlay';
    messageOverlay.innerText = 'Connecting...';
    document.body.appendChild(messageOverlay);

    if (!roomId) {
        messageOverlay.innerText = 'Invalid Room ID.\nPlease scan the QR code.';
        return;
    }

    // Inject UI controls (initially hidden)
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'controls-container';
    controlsContainer.style.display = 'none';

    const brand = document.createElement('div');
    brand.className = 'brand';
    brand.innerText = 'Joypad Controller';
    controlsContainer.appendChild(brand);

    const row = document.createElement('div');
    row.className = 'row';

    const btnLeft = document.createElement('button');
    btnLeft.innerHTML = '&#9664;'; // Left arrow
    row.appendChild(btnLeft);

    const btnRight = document.createElement('button');
    btnRight.innerHTML = '&#9654;'; // Right arrow
    row.appendChild(btnRight);

    controlsContainer.appendChild(row);

    const btnDrop = document.createElement('button');
    btnDrop.id = 'btn-drop';
    btnDrop.innerText = 'DROP';
    controlsContainer.appendChild(btnDrop);

    document.body.appendChild(controlsContainer);

    // Connect to Socket.IO
    const socket = io();
    
    socket.on('connect', () => {
        socket.emit('join_room', roomId);
    });

    // Socket listeners
    socket.on('join_success', () => {
        messageOverlay.style.display = 'none';
        controlsContainer.style.display = 'flex';
    });

    socket.on('access_denied', (reason) => {
        controlsContainer.style.display = 'none';
        messageOverlay.innerText = reason;
        messageOverlay.style.display = 'flex';
    });

    socket.on('game_over', () => {
        controlsContainer.style.display = 'none';
        messageOverlay.innerText = 'Game Over.\nCheck the main screen.';
        messageOverlay.style.display = 'flex';
        socket.disconnect(); // Disconnect to allow a new player to join next round
    });

    socket.on('disconnect', () => {
        controlsContainer.style.display = 'none';
        messageOverlay.innerText = 'Disconnected from server.';
        messageOverlay.style.display = 'flex';
    });

    // Interaction handling for press-and-hold
    let leftInterval = null;
    let rightInterval = null;

    function startLeft(e) {
        if (e && e.cancelable) e.preventDefault(); // Prevent scrolling/zooming
        if (leftInterval) return;
        socket.emit('move_left', roomId); // Emit immediately
        leftInterval = setInterval(() => {
            socket.emit('move_left', roomId);
        }, 50); // Emit every 50ms while held
    }

    function stopLeft(e) {
        if (e && e.cancelable) e.preventDefault();
        if (leftInterval) {
            clearInterval(leftInterval);
            leftInterval = null;
        }
    }

    function startRight(e) {
        if (e && e.cancelable) e.preventDefault(); // Prevent scrolling/zooming
        if (rightInterval) return;
        socket.emit('move_right', roomId); // Emit immediately
        rightInterval = setInterval(() => {
            socket.emit('move_right', roomId);
        }, 50); // Emit every 50ms while held
    }

    function stopRight(e) {
        if (e && e.cancelable) e.preventDefault();
        if (rightInterval) {
            clearInterval(rightInterval);
            rightInterval = null;
        }
    }

    function handleDrop(e) {
        if (e && e.cancelable) e.preventDefault(); // Prevent scrolling/zooming
        socket.emit('drop', roomId);
        
        // Disable buttons locally immediately after drop
        controlsContainer.style.pointerEvents = 'none';
        controlsContainer.style.opacity = '0.5';
        
        // Make sure to clear intervals if they were active
        stopLeft();
        stopRight();
    }

    // Attach event listeners for both touch devices and mouse interactions
    btnLeft.addEventListener('touchstart', startLeft, { passive: false });
    btnLeft.addEventListener('touchend', stopLeft);
    btnLeft.addEventListener('touchcancel', stopLeft);
    btnLeft.addEventListener('mousedown', startLeft);
    btnLeft.addEventListener('mouseup', stopLeft);
    btnLeft.addEventListener('mouseleave', stopLeft);

    btnRight.addEventListener('touchstart', startRight, { passive: false });
    btnRight.addEventListener('touchend', stopRight);
    btnRight.addEventListener('touchcancel', stopRight);
    btnRight.addEventListener('mousedown', startRight);
    btnRight.addEventListener('mouseup', stopRight);
    btnRight.addEventListener('mouseleave', stopRight);

    btnDrop.addEventListener('touchstart', handleDrop, { passive: false });
    btnDrop.addEventListener('mousedown', handleDrop);
});