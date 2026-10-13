// A chip of what he attached, in his sent bubble (file-chips, main m_21751, designer m_21765): an
// image or a file. A click previews it (macOS Quick Look, window.bise.quickLook), a right-click
// shows it in Finder (window.bise.showInFinder); its title says so. A file the hub found gone when
// he sent it says '· missing' and opens nothing; one gone since, at the click, says so the same
// way. A file's 16 px system icon (window.bise.fileIcon) where an image has its thumbnail, ▯ when
// there is none. Owner: file-chips (amb-win's thread).
import { useEffect, useState, type ReactNode } from 'react';
import { Chip } from '@/ds';

/** The hover words of an attachment's chip (designer m_21765). */
export const OPEN_TITLE = 'preview · right-click: show in Finder';

/** 'deck.pptx is gone from ~/Desktop' (the TUI's open_file gone_words). Pure. */
export function goneWords(path: string, home: string): string {
  const cut = path.lastIndexOf('/');
  const dir = cut <= 0 ? '/' : path.slice(0, cut);
  const shown = home !== '' && (dir === home || dir.startsWith(`${home}/`)) ? `~${dir.slice(home.length)}` : dir;
  return `${path.slice(cut + 1)} is gone from ${shown}`;
}

const bise = (): Partial<Window['bise']> | undefined => (window as Partial<Window>).bise;

/** A file's system icon, else ▯ (the composer chip's slot). */
export function FileThumb({ path }: { path: string }) {
  const [icon, setIcon] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void bise()
      ?.fileIcon?.(path)
      .then((u) => {
        if (live) setIcon(u);
      });
    return () => {
      live = false;
    };
  }, [path]);
  return icon === null ? (
    <span className="thumb file" aria-hidden="true">
      ▯
    </span>
  ) : (
    <img className="thumb" src={icon} alt="" />
  );
}

/** One attachment chip: `thumb` then its words; gone (by the hub, or at a click): '· missing'. */
export function AttachChip({ of, path, missing, thumb, testId, children }: { of: 'image' | 'file'; path: string; missing: boolean; thumb: ReactNode; testId: string; children: ReactNode }) {
  const [gone, setGone] = useState(missing);
  const home = bise()?.home ?? '';
  const title = gone ? goneWords(path, home) : `${path}\n${OPEN_TITLE}`;
  // the chip itself is the row's child (thread/parts measures the row's children)
  return (
    <Chip
      kind="part"
      of={of}
      title={title}
      thumb={thumb}
      onClick={() => {
        if (gone) return;
        void bise()
          ?.quickLook?.(path)
          .then((ok) => {
            if (!ok) setGone(true);
          });
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!gone) void bise()?.showInFinder?.(path);
      }}
      testId={testId}
    >
      {children}
      {gone && (
        <>
          <span className="th-attach-sep"> · </span>
          <span className="th-attach-missing">missing</span>
        </>
      )}
    </Chip>
  );
}
