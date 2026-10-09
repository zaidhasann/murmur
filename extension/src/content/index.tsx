import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { MicOrb } from '@/components/features/MicOrb';
import { ExpandedWidget } from '../widget/ExpandedWidget';
import tailwindCss from '../sidepanel/sidepanel.css?inline';

const BUBBLE_STORAGE_KEY = 'murmur_bubble_pos_v1';

export const ContentOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHalfTucked, setIsHalfTucked] = useState(false);
  const idleTimerRef = useRef<any>(null);

  // Load saved position
  useEffect(() => {
    chrome.storage.local.get([BUBBLE_STORAGE_KEY], (res) => {
      if (res && res[BUBBLE_STORAGE_KEY]) {
        setPosition(res[BUBBLE_STORAGE_KEY]);
      }
    });

    // Listen to background command to toggle widget
    const msgListener = (msg: any) => {
      if (msg.type === 'TOGGLE_WIDGET') {
        setIsOpen((prev) => !prev);
      }
    };
    chrome.runtime.onMessage.addListener(msgListener);
    return () => chrome.runtime.onMessage.removeListener(msgListener);
  }, []);

  // Idle timer for 3s half-tuck
  useEffect(() => {
    if (isOpen || isDragging) {
      setIsHalfTucked(false);
      clearTimeout(idleTimerRef.current);
      return;
    }

    idleTimerRef.current = setTimeout(() => {
      setIsHalfTucked(true);
    }, 3000);

    return () => clearTimeout(idleTimerRef.current);
  }, [isOpen, isDragging, position]);

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    setIsDragging(true);
    setIsHalfTucked(false);

    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nextX = Math.max(10, Math.min(window.innerWidth - 70, moveEvent.clientX - startX));
      const nextY = Math.max(10, Math.min(window.innerHeight - 70, moveEvent.clientY - startY));
      setPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      // Snap to nearest edge
      setPosition((current) => {
        const snapLeft = current.x < window.innerWidth / 2;
        const finalX = snapLeft ? 16 : window.innerWidth - 72;
        const finalPos = { x: finalX, y: current.y };
        chrome.storage.local.set({ [BUBBLE_STORAGE_KEY]: finalPos });
        return finalPos;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const isNearRight = position.x > window.innerWidth / 2;
  const isNearBottom = position.y > window.innerHeight / 2;

  return (
    <div
      style={{
        position: 'fixed',
        left: isOpen ? (isNearRight ? position.x - 290 : position.x) : position.x,
        top: isOpen ? (isNearBottom ? position.y - 430 : position.y) : position.y,
        transform: isHalfTucked && !isOpen ? (isNearRight ? 'translateX(28px)' : 'translateX(-28px)') : 'none',
        transition: isDragging ? 'none' : 'transform 0.25s ease-out, left 0.2s ease-out, top 0.2s ease-out',
        zIndex: 2147483647,
      }}
      onMouseEnter={() => setIsHalfTucked(false)}
    >
      {isOpen ? (
        <ExpandedWidget
          onClose={() => setIsOpen(false)}
          openSidePanel={() => {
            setIsOpen(false);
            chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
          }}
        />
      ) : (
        <div
          onMouseDown={handleMouseDown}
          onClick={() => {
            if (!isDragging) setIsOpen(true);
          }}
          style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
          className="relative pointer-events-auto"
        >
          <MicOrb
            state="idle"
            audioVolume={0}
            onClick={() => setIsOpen(true)}
          />
        </div>
      )}
    </div>
  );
};

// Mount inside closed Shadow DOM for style isolation
function mountMurmurOverlay() {
  // Prevent double mounting in SPA
  if (document.getElementById('murmur-shadow-host')) return;

  const host = document.createElement('div');
  host.id = 'murmur-shadow-host';
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '0';
  host.style.height = '0';
  host.style.zIndex = '2147483647';
  host.style.pointerEvents = 'none';

  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  // Inject styles into shadow root
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    :host { all: initial; }
    ${tailwindCss}
  `;
  shadow.appendChild(styleEl);

  const container = document.createElement('div');
  shadow.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(<ContentOverlay />);
}

if (window.top === window.self) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountMurmurOverlay);
  } else {
    mountMurmurOverlay();
  }
}
