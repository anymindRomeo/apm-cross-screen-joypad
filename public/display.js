document.addEventListener('DOMContentLoaded', () => {
    // Generate random room ID
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Connect to Socket.IO
    const socket = io();
    socket.emit('create_room', roomId);

    const materialSrc = "https://creative.cdn.apm.any-digital.com/scb/20250528-mobile-full-page-claw-machine";
    const items = ["b1", "b2", "b3", "b4", "b5"];

    // Inject CSS matching the original claw machine structure
    const style = document.createElement('style');
    style.innerHTML = `
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #111; display: flex; align-items: center; justify-content: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; overflow: hidden; }

        #Wrapper {
            position: relative;
            height: 100%;
            aspect-ratio: 640/960;
            max-width: 100%;
            overflow: hidden;
            background: #000;
            box-shadow: 0 0 30px rgba(0,0,0,0.8);
        }

        #BgFrame { position: absolute; width: 100%; height: 100%; z-index: 1; }
        #BackgroundImage { position: absolute; top: -1px; width: 100%; z-index: 2000; object-fit: contain; }

        #clip1 { position: absolute; top: 0%; left: 5%; width: 16%; z-index: 100; transition: transform 0.1s linear; }

        #b1 { position: absolute; top: 62%; left: 5%; width: 22%; z-index: 1000; transition: 1s; }
        #b2 { position: absolute; top: 63%; left: 25%; width: 20%; z-index: 1000; }
        #b3 { position: absolute; top: 60%; left: 41%; width: 29%; z-index: 1000; }
        #b4 { position: absolute; top: 65%; left: 63%; width: 20%; z-index: 1001; }
        #b5 { position: absolute; top: 60%; left: 74%; width: 25%; z-index: 1000; }

        /* Claw animations */
        @keyframes c1 { 0% { transform: translate(15%, 0px); } 30% { transform: translate(15%, 32%); } 100% { transform: translate(15%, -60%); } }
        .clip1-animation { animation: c1 2.1s linear forwards; }
        @keyframes b1 { 0% { transform: translate(0px, 0px); } 100% { transform: translate(0%, -370%); } }
        .b1-animation { animation: b1 1.72s linear forwards; animation-delay: 0.65s; }

        @keyframes c2 { 0% { transform: translate(135%, 0px); } 30% { transform: translate(135%, 34%); } 100% { transform: translate(135%, -60%); } }
        .clip2-animation { animation: c2 2.1s linear forwards; }
        @keyframes b2 { 0% { transform: translate(0px, 0px); } 100% { transform: translate(0%, -370%); } }
        .b2-animation { animation: b2 1.55s linear forwards; animation-delay: 0.65s; }

        @keyframes c3 { 0% { transform: translate(230%, 0px); } 30% { transform: translate(230%, 28%); } 100% { transform: translate(230%, -60%); } }
        .clip3-animation { animation: c3 2.1s linear forwards; }
        @keyframes b3 { 0% { transform: translate(0px, 0px); } 100% { transform: translate(0%, -370%); } }
        .b3-animation { animation: b3 2.3s linear forwards; animation-delay: 0.65s; }

        @keyframes c4 { 0% { transform: translate(355%, 0px); } 30% { transform: translate(355%, 38%); } 100% { transform: translate(355%, -60%); } }
        .clip4-animation { animation: c4 2.1s linear forwards; }
        @keyframes b4 { 0% { transform: translate(0px, 0px); } 100% { transform: translate(0%, -400%); } }
        .b4-animation { animation: b4 1.56s linear forwards; animation-delay: 0.65s; }

        @keyframes c5 { 0% { transform: translate(440%, 0px); } 30% { transform: translate(440%, 28%); } 100% { transform: translate(440%, -60%); } }
        .clip5-animation { animation: c5 1.99s linear forwards; }
        @keyframes b5 { 0% { transform: translate(0px, 0px); } 100% { transform: translate(0%, -300%); } }
        .b5-animation { animation: b5 1.6s linear forwards; animation-delay: 0.65s; }

        .fadeOut { animation: fadeOut 0.5s linear forwards; }
        @keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }

        /* UI Overlays */
        #qr-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(255,255,255,0.95); padding: 30px; border-radius: 15px; text-align: center; z-index: 5000; box-shadow: 0 10px 20px rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; }
        #qr-container h2 { margin-top: 0; color: #2c3e50; font-size: 28px; margin-bottom: 20px; }
        #qrcode { margin-bottom: 20px; }
        #qr-container p { font-size: 16px; font-weight: bold; background: #ecf0f1; padding: 10px; border-radius: 8px; color: #34495e; word-break: break-all; max-width: 250px; margin-bottom: 0; }

        #banner-modal { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 6000; display: none; align-items: center; justify-content: center; flex-direction: column; text-align: center; }
        .win { color: #2ecc71; font-size: 60px; font-weight: bold; text-shadow: 0 5px 15px rgba(46, 204, 113, 0.5); }
        .lose { color: #e74c3c; font-size: 60px; font-weight: bold; text-shadow: 0 5px 15px rgba(231, 76, 60, 0.5); }
    `;
    document.head.appendChild(style);

    // Inject UI structure
    const wrapper = document.createElement('div');
    wrapper.id = 'Wrapper';

    const controllerUrl = `${window.location.origin}/controller.html?id=${roomId}`;

    wrapper.innerHTML = `
        <img id="BgFrame" src="${materialSrc}/back.png" alt="bgFrame" />
        <img id="clip1" src="${materialSrc}/claw.png" alt="clip1" style="transform: translateX(0px);" />
        <img id="b1" src="${materialSrc}/lotso_8.png" alt="b1" />
        <img id="b2" src="${materialSrc}/alien_v2.png" alt="b2" />
        <img id="b3" src="${materialSrc}/buzz_v2.png" alt="b3" />
        <img id="b4" src="${materialSrc}/pig_v2.png" alt="b4" />
        <img id="b5" src="${materialSrc}/woody_v2.png" alt="b5" />
        <img id="BackgroundImage" src="${materialSrc}/front_v4.png" alt="" />
        
        <div id="qr-container">
            <h2>Scan to Play!</h2>
            <div id="qrcode"></div>
            <p>${controllerUrl}</p>
        </div>
        <div id="banner-modal"></div>
    `;

    document.body.appendChild(wrapper);

    // Generate QR Code
    new QRCode(document.getElementById("qrcode"), {
        text: controllerUrl,
        width: 200,
        height: 200,
        colorDark : "#2c3e50",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    // Game state
    const clip1 = document.getElementById('clip1');
    const bannerModal = document.getElementById('banner-modal');
    const qrContainer = document.getElementById('qr-container');

    let isPlaying = false;
    let isDropping = false;
    let clipXPosition = 0; // translation in pixels

    // Socket listeners
    socket.on('player_joined', () => {
        qrContainer.style.display = 'none';
        isPlaying = true;
    });

    socket.on('player_disconnected', () => {
        resetGame();
        qrContainer.style.display = 'block';
    });

    socket.on('move_left', () => {
        if (!isPlaying || isDropping) return;
        clipXPosition = Math.max(0, clipXPosition - 20);
        clip1.style.transform = `translateX(${clipXPosition}px)`;
    });

    socket.on('move_right', () => {
        if (!isPlaying || isDropping) return;
        const computedWidth = wrapper.clientWidth;
        const clawWidth = clip1.clientWidth || (computedWidth * 0.16);
        const maxTranslate = computedWidth - clawWidth - (computedWidth * 0.05); // max boundary
        clipXPosition = Math.min(maxTranslate, clipXPosition + 20);
        clip1.style.transform = `translateX(${clipXPosition}px)`;
    });

    socket.on('drop', () => {
        if (!isPlaying || isDropping) return;
        isDropping = true;
        
        const computedWidth = wrapper.clientWidth;
        const area = computedWidth - (computedWidth * 0.1);

        let caughtItem = null;
        let clipAnim = '';
        let itemAnim = '';

        // Match the logic from the original script to determine which zone was hit
        if (clipXPosition >= 0 && clipXPosition < area * 0.2) {
            clipAnim = "clip1-animation"; itemAnim = "b1-animation"; caughtItem = "b1";
        } else if (clipXPosition >= area * 0.2 && clipXPosition < area * 0.4) {
            clipAnim = "clip2-animation"; itemAnim = "b2-animation"; caughtItem = "b2";
        } else if (clipXPosition >= area * 0.4 && clipXPosition < area * 0.6) {
            clipAnim = "clip3-animation"; itemAnim = "b3-animation"; caughtItem = "b3";
        } else if (clipXPosition >= area * 0.6 && clipXPosition < area * 0.8) {
            clipAnim = "clip4-animation"; itemAnim = "b4-animation"; caughtItem = "b4";
        } else {
            clipAnim = "clip5-animation"; itemAnim = "b5-animation"; caughtItem = "b5";
        }

        // Apply drop animations
        clip1.style.transform = ''; // Clear inline transform so CSS animation handles positioning
        clip1.classList.add(clipAnim);

        const itemEl = document.getElementById(caughtItem);
        if (itemEl) itemEl.classList.add(itemAnim);

        // Hide other items when the claw has pulled up
        setTimeout(() => {
            items.forEach(id => {
                if (id !== caughtItem) {
                    const el = document.getElementById(id);
                    if (el) el.classList.add("fadeOut");
                }
            });
            clip1.style.display = 'none';

            // Show Final Win/Lose result based on target b3
            const isWin = caughtItem === 'b3';
            bannerModal.innerHTML = isWin 
                ? `<div class="win">YOU WIN! 🎉</div>` 
                : `<div class="lose">YOU LOSE! 😭</div>`;
            bannerModal.style.display = 'flex';

            // Notify server game is over
            socket.emit('game_over', roomId);

            // Hold banner for 5 seconds before resetting
            setTimeout(() => {
                resetGame();
            }, 5000);

        }, 2700); // 2.7s is the duration of the claw animation in original script
    });

    function resetGame() {
        isPlaying = false;
        isDropping = false;
        clipXPosition = 0;
        
        clip1.className = '';
        clip1.style.display = 'block';
        clip1.style.transform = `translateX(${clipXPosition}px)`;

        items.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.className = '';
                el.style.opacity = '1';
            }
        });

        bannerModal.style.display = 'none';
        qrContainer.style.display = 'block';
    }
});