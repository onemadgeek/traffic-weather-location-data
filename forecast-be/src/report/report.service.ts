import { Injectable } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SearchLog } from '../entities/search-log.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(SearchLog) private readonly searchLogRepo: Repository<SearchLog>,
  ) { }

  async getRecentSearchLogs(): Promise<SearchLog[]> {
    return this.searchLogRepo.find({
      order: { dateTime: 'DESC' },
      take: 10,
    });
  }

  async getTopSearchLogs(startDateTime: string, endDateTime: string): Promise<SearchLog[]> {
    const startDateObj = new Date(parseInt(startDateTime));
    const endDateObj = new Date(parseInt(endDateTime));
    return this.searchLogRepo.find({
      where: {
        dateTime: Between(startDateObj, endDateObj),
      },
      order: { dateTime: 'DESC' },
      take: 10,
    });
  }

  async getMostSearchedPeriod(
    startDateTime: string,
    endDateTime: string,
  ): Promise<Date> {
    const startDateObj = new Date(parseInt(startDateTime));
    const endDateObj = new Date(parseInt(endDateTime));
    // Assuming we're interested in the most searched period within an hour
    const result = await this.searchLogRepo
      .createQueryBuilder('searchLog')
      .select(`DATE_TRUNC('hour', searchLog.dateTime)`, 'period')
      .addSelect('COUNT(searchLog.id)', 'count')
      .where('searchLog.dateTime BETWEEN :startDate AND :endDate', { startDate: startDateObj, endDate: endDateObj })
      .groupBy('period')
      .orderBy('count', 'DESC')
      .limit(1)
      .getRawOne();
    if (result && result.period) {
        return new Date(result.period);
    } else {
        return null;
    }
  }
}
