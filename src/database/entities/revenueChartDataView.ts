import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'revenue_chart_data',
  expression: (connection) =>
    connection
      .createQueryBuilder()
      .select('re."tokenId"', 'tokenId')
      .addSelect('re."amount"', 'amount')
      .addSelect(
        `strftime('%d', datetime(be."timestamp"/1000, 'unixepoch'))`,
        'day'
      )
      .addSelect(
        `strftime('%m', datetime(be."timestamp"/1000, 'unixepoch'))`,
        'month'
      )
      .addSelect(
        `strftime('%Y', datetime(be."timestamp"/1000, 'unixepoch'))`,
        'year'
      )
      .from('revenue_entity', 're')
      .innerJoin('permit_entity', 'pe', 're."permitId" = pe.id')
      .innerJoin('block_entity', 'be', 'pe.block = be.hash'),
})
export class RevenueChartDataView {
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
