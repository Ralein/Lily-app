import { Component, input } from '@angular/core';
import { LILY_ICONS } from './lily-icons';

/**
 * Dynamic icon component for Lily.
 * Usage: <lily-icon name="wallet" [size]="20" />
 *
 * For static known icons, prefer direct Lucide directive:
 *   <svg lucideWallet [size]="20"></svg>
 *
 * Use <lily-icon> when the icon name comes from data (e.g. category icons).
 */
@Component({
  selector: 'lily-icon',
  standalone: true,
  imports: [...LILY_ICONS],
  template: `
    @switch (name()) {
      @case ('utensils-crossed') { <svg lucideUtensilsCrossed [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('car') { <svg lucideCar [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('clapperboard') { <svg lucideClapperboard [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('shopping-bag') { <svg lucideShoppingBag [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('lightbulb') { <svg lucideLightbulb [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('heart-pulse') { <svg lucideHeartPulse [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('graduation-cap') { <svg lucideGraduationCap [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('carrot') { <svg lucideCarrot [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('smartphone') { <svg lucideSmartphone [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('sparkles') { <svg lucideSparkles [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('wallet') { <svg lucideWallet [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('laptop') { <svg lucideLaptop [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('trending-up') { <svg lucideTrendingUp [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('gift') { <svg lucideGift [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('package') { <svg lucidePackage [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('layout-dashboard') { <svg lucideLayoutDashboard [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('credit-card') { <svg lucideCreditCard [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('chart-line') { <svg lucideChartLine [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('target') { <svg lucideTarget [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('trophy') { <svg lucideTrophy [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('settings') { <svg lucideSettings [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('flower-2') { <svg lucideFlower2 [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('plus') { <svg lucidePlus [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('minus') { <svg lucideMinus [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('check') { <svg lucideCheck [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('x') { <svg lucideX [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('pencil') { <svg lucidePencil [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('trash-2') { <svg lucideTrash2 [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('search') { <svg lucideSearch [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('filter') { <svg lucideFilter [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('download') { <svg lucideDownload [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('upload') { <svg lucideUpload [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('info') { <svg lucideInfo [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('triangle-alert') { <svg lucideTriangleAlert [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('circle-check') { <svg lucideCircleCheck [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('circle-x') { <svg lucideCircleX [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('bell') { <svg lucideBell [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('circle-dollar-sign') { <svg lucideCircleDollarSign [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('calendar') { <svg lucideCalendar [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('clock') { <svg lucideClock [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('zap') { <svg lucideZap [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('flame') { <svg lucideFlame [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('bar-chart-3') { <svg lucideBarChart3 [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('pie-chart') { <svg lucidePieChart [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('activity') { <svg lucideActivity [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('arrow-up-right') { <svg lucideArrowUpRight [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('arrow-down-right') { <svg lucideArrowDownRight [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('badge-dollar-sign') { <svg lucideBadgeDollarSign [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('receipt') { <svg lucideReceipt [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('hand-coins') { <svg lucideHandCoins [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('palette') { <svg lucidePalette [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('database') { <svg lucideDatabase [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('sun') { <svg lucideSun [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('moon') { <svg lucideMoon [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('monitor') { <svg lucideMonitor [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('plane') { <svg lucidePlane [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('house') { <svg lucideHouse [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('party-popper') { <svg lucidePartyPopper [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('thumbs-up') { <svg lucideThumbsUp [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('chevron-right') { <svg lucideChevronRight [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('chevron-down') { <svg lucideChevronDown [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('chevron-left') { <svg lucideChevronLeft [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('arrow-left') { <svg lucideArrowLeft [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @case ('arrow-right') { <svg lucideArrowRight [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
      @default { <svg lucidePackage [size]="size()" [strokeWidth]="strokeWidth()"></svg> }
    }
  `,
  styles: [`:host { display: inline-flex; align-items: center; justify-content: center; line-height: 0; }`],
})
export class LilyIconComponent {
  name = input.required<string>();
  size = input<number>(18);
  strokeWidth = input<number>(2);
}
