import { type ReactNode } from 'react';

import classNames from 'classnames';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@cctv/core/Button/Button';

import styles from './PanelSidebar.module.scss';

interface PanelSidebarProps {
  side: 'left' | 'right';
  collapsed: boolean;
  onToggle: () => void;
  title: string;
  headerActions?: ReactNode;
  collapsedContent?: ReactNode;
  children: ReactNode;
}

export default function PanelSidebar({
  side,
  collapsed,
  onToggle,
  title,
  headerActions,
  collapsedContent,
  children,
}: PanelSidebarProps) {
  const expandIcon = side === 'left' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />;
  const collapseIcon = side === 'left' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />;

  return (
    <aside
      className={classNames(styles.sidebar, styles[side], {
        [styles.collapsed]: collapsed,
        [styles.expanded]: !collapsed,
      })}
    >
      <div
        className={classNames(styles.header, {
          [styles.collapsedHeader]: collapsed,
        })}
      >
        {!collapsed && <div className={styles.headerTitle}>{title}</div>}
        <div className={styles.headerActions}>
          {!collapsed && headerActions}
          <Button
            variant="ghost"
            size="sm"
            icon={collapsed ? expandIcon : collapseIcon}
            hideLabel
            onClick={onToggle}
            title={collapsed ? `Expand ${title}` : `Collapse ${title}`}
            aria-expanded={!collapsed}
          >
            {collapsed ? `Expand ${title}` : `Collapse ${title}`}
          </Button>
        </div>
      </div>

      <div className={styles.content}>{collapsed ? collapsedContent : children}</div>
    </aside>
  );
}
