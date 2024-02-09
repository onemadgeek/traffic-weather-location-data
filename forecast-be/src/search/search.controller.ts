import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchLocationDto } from './dto/search.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('traffic-weather-forecast')
  async searchTrafficWeatherForecast(@Query() searchLocationDto: SearchLocationDto) {
    try {
      const data = await this.searchService.searchTrafficWeatherForecast(searchLocationDto);
      return { success: true, data: data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}
