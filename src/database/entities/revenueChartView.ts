import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'revenue_chart_view',
  expression: (connection) =>
    connection
      .createQueryBuilder()
      .select('re."tokenId"', 'tokenId')
      .addSelect('re."amount"', 'amount')
      .addSelect(
        `strftime('%d', datetime(be."timestamp"/1000, 'unixepoch'))`,
        'Day'
      )
      .addSelect(
        `strftime('%m', datetime(be."timestamp"/1000, 'unixepoch'))`,
        'Month'
      )
      .addSelect(
        `strftime('%Y', datetime(be."timestamp"/1000, 'unixepoch'))`,
        'Year'
      )
      .from('revenue_entity', 're')
      .innerJoin('permit_entity', 'pe', 're."permitId" = pe.id')
      .innerJoin('block_entity', 'be', 'pe.block = be.hash'),
})
export class RevenueChartView {
  @ViewColumn()
  tokenId!: string;

  @ViewColumn()
  amount!: string;

  @ViewColumn()
  day!: number;

  @ViewColumn()
  month!: number;

  @ViewColumn()
  year!: number;
}
