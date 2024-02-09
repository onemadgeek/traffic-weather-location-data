import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SearchLocationDto } from './dto/search.dto';
import axios from 'axios';
import { SearchLog } from '../entities/search-log.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(SearchLog) private readonly searchLogRepo: Repository<SearchLog>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) { }

  isDataValid(data: any): boolean {
    return data && data.items && data.items.length > 0 && data.area_metadata;
  }

  combineLocationData(trafficData, weatherData) {
    const retval = {};
    const areaMetadataDict = {};
    weatherData.area_metadata.forEach(area => {
      const areaLocation = area.label_location;
      const areaLatitude = parseFloat(areaLocation.latitude.toFixed(3));
      const areaLongitude = parseFloat(areaLocation.longitude.toFixed(3));
      areaMetadataDict[area.name] = {
        latitude: areaLatitude,
        longitude: areaLongitude,
      };
    });

    const forecastDict = {};
    weatherData.items.forEach(weatherItem => {
      weatherItem.forecasts.forEach(areaForecast => {
        const area = areaForecast.area;
        const forecast = areaForecast.forecast;
        forecastDict[area] = forecast;
      });
    });

    trafficData.items.forEach(trafficItem => {
      trafficItem.cameras.forEach(camera => {
        const trafficLocation = camera.location;
        const trafficLatitude = trafficLocation.latitude;
        const trafficLongitude = trafficLocation.longitude;

        let nearestArea = null;
        let minDistance = Number.MAX_VALUE;
        for (const areaName in areaMetadataDict) {
          const areaLocation = areaMetadataDict[areaName];
          const areaLatitude = areaLocation.latitude;
          const areaLongitude = areaLocation.longitude;
          const distance = Math.sqrt(Math.pow(areaLatitude - trafficLatitude, 2) + Math.pow(areaLongitude - trafficLongitude, 2));
          if (distance < minDistance) {
            nearestArea = areaName;
            minDistance = distance;
          }
        }

        let forecast = forecastDict[nearestArea];

        const combinedItem = {
          timestamp: trafficItem.timestamp,
          camera_id: camera.camera_id,
          image: camera.image,
          forecast: forecast,
          location: camera.location
        };

        if (!(nearestArea in retval)) {
          retval[nearestArea] = [combinedItem];
        } else {
          retval[nearestArea].push(combinedItem);
        }
      });
    });
    return retval;
  }

  isTrafficDataValid(data: any): boolean {
    return data && data.items && data.items.length > 0 && data.items[0].cameras;
  }

  isWeatherDataValid(data: any): boolean {
    return data && data.items && data.items.length > 0 && data.area_metadata;
  }

  async logSearch(searchLocationDto: SearchLocationDto) {
    let user = await this.userRepo.findOne({ where: { username: searchLocationDto.username } });
    if (!user) {
      user = await this.userRepo.save({ username: searchLocationDto.username });
    }
    await this.searchLogRepo.save({
      dateTime: new Date(searchLocationDto.date_time),
      username: searchLocationDto.username,
      location: searchLocationDto.location || '',
      user: user,
    });
  }

  async searchTrafficWeatherForecast(searchLocationDto: SearchLocationDto) {
    try {
      this.logSearch(searchLocationDto);
      if (searchLocationDto.justLog) {
        return {}
      }
      const cacheKey = searchLocationDto.date_time;
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        console.log(`Getting data from cache for key: ${cacheKey}`);
        return cachedResult;
      }
      const trafficImagesResponse = await axios.get<any>(`https://api.data.gov.sg/v1/transport/traffic-images?date_time=${searchLocationDto.date_time}`);
      const weatherForecastResponse = await axios.get<any>(`https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date_time=${searchLocationDto.date_time}`);
      const trafficImagesData = trafficImagesResponse.data;
      const weatherForecastData = weatherForecastResponse.data;
      if (this.isTrafficDataValid(trafficImagesData) && this.isWeatherDataValid(weatherForecastData)) {
        const result = this.combineLocationData(trafficImagesData, weatherForecastData);
        await this.cacheService.set(cacheKey, result);
        return result;
      } else {
        return { error: true, message: "Data not available for selected dates. please try different date time." }
      }
    } catch (error) {
      console.error(`Error is: ${error}`);
      throw error;
    }
  }
}
