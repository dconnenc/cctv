import { useExperience } from '@cctv/contexts/ExperienceContext';
import { SegmentBadge } from '@cctv/core/SegmentBadge/SegmentBadge';
import { Block } from '@cctv/types';

export function hasTargetingRules(block: Block): boolean {
  return (
    (block.visible_to_roles?.length ?? 0) > 0 ||
    (block.visible_to_segments?.length ?? 0) > 0 ||
    (block.target_user_ids?.length ?? 0) > 0
  );
}

export function VisibilityDetails({ block }: { block: Block }) {
  const { experience } = useExperience();
  const definedSegments = experience?.segments || [];

  return (
    <details className="inline-block">
      <summary className="cursor-pointer text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded select-none">
        Targeted
      </summary>
      <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))] space-y-0.5">
        {(block.visible_to_roles?.length ?? 0) > 0 && (
          <div>Roles: {block.visible_to_roles!.join(', ')}</div>
        )}
        {(block.visible_to_segments?.length ?? 0) > 0 && (
          <div>
            Segments:{' '}
            {block.visible_to_segments!.map((name) => {
              const seg = definedSegments.find((s) => s.name === name);
              return <SegmentBadge key={name} name={name} color={seg?.color || '#6B7280'} />;
            })}
          </div>
        )}
        {(block.target_user_ids?.length ?? 0) > 0 && (
          <div>Targeted users: {block.target_user_ids!.length}</div>
        )}
      </div>
    </details>
  );
}
