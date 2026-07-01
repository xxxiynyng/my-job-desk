import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * dnd-kit 드래그 핸들의 공통 뼈대 — attributes/listeners/ref는 이 엘리먼트에만 바인딩해서
 * 행 클릭·정렬 버튼 등 주변 인터랙션과 겹치지 않게 한다.
 * 탭1 컬럼 헤더 그립처럼 아이콘을 직접 보여줄 수도 있고(기본값),
 * 탭2 행 그립처럼 다른 곳에 이미 그려진 아이콘 위에 투명 히트 영역만 올릴 수도 있다(icon={null}).
 */
type DragHandleProps = ComponentPropsWithoutRef<"div"> & {
  iconClassName?: string;
  icon?: ReactNode | null;
};

export const DragHandle = forwardRef<HTMLDivElement, DragHandleProps>(
  ({ className, iconClassName, icon, ...props }, ref) => (
    <div ref={ref} {...props} className={cn("cursor-grab active:cursor-grabbing", className)}>
      {icon === null ? null : icon ?? <GripVertical className={cn("pointer-events-none", iconClassName)} />}
    </div>
  ),
);
DragHandle.displayName = "DragHandle";
