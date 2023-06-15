import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'revenue_chart_entity',
})
export class RevenueChartEntity {
  @PrimaryColumn()
  id: number;

  @Column()
  year: number;

  @Column()
  month: number;

  @Column()
  day: number;

  @Column()
  revenue: number;
}
