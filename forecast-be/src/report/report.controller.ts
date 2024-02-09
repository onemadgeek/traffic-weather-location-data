import {
  Controller,
  Get,
  Query
} from '@nestjs/common';
import { ReportService } from './report.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('user')
@Controller('user')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('recent-search-logs')
  async getRecentSearchLogs() {
    try {
      const recentSearchLogs = await this.reportService.getRecentSearchLogs();
      return { success: true, data: recentSearchLogs };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  @Get('top-search-logs')
  async getTopSearchLogs(
    @Query('startDateTime') startDateTime: string,
    @Query('endDateTime') endDateTime: string,
  ) {
    try {
      const topSearchLogs = await this.reportService.getTopSearchLogs(
        startDateTime,
        endDateTime,
      );
      return { success: true, data: topSearchLogs };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  @Get('/most-searched-period')
  async getMostSearchedPeriod(
    @Query('startDateTime') startDateTime: string,
    @Query('endDateTime') endDateTime: string,
  ): Promise<Date> {
    const mostSearchedPeriod = await this.reportService.getMostSearchedPeriod(startDateTime, endDateTime);
    return mostSearchedPeriod;
  }
}
