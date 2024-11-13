import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerUtil } from '../utils/logger.utils';
import { getAllEmployee } from '../utils/api.utils';
import { EmployeeResData } from '../interfaces/api-service.interfaces';
import { handleError } from '../utils/common.utils';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new LoggerUtil('PrismaService');

  public async onModuleInit() {
    await this.$connect();
    this.logger.info('Database is connected');

    try {
      await this.synchronizeEmployeeCache();
    } catch (error) {
      this.logger.info('synchronize employee cache failed');
      this.logger.error(error);
    }
  }

  public async onModuleDestroy() {
    await this.$disconnect();
    this.logger.info('Database is disconnected');
  }

  public async updateEmployeeCache(employee: EmployeeResData) {
    const { nik, name, area } = employee;
    const cachedEmployee = await this.employeeCache.findUnique({
      where: { nik },
    });

    try {
      if (cachedEmployee) {
        let updateName: string = undefined;
        let updateArea: string = undefined;

        if (name !== cachedEmployee.name) updateName = name;
        if (area !== cachedEmployee.area) updateArea = area;

        if (updateName || updateArea)
          await this.employeeCache.update({
            where: { nik },
            data: { name: updateName, area: updateArea },
          });
      } else
        await this.employeeCache.create({
          data: { nik, name, area },
        });
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  public async synchronizeEmployeeCache() {
    this.logger.info('Synchronizing employee cache');

    const employees = await getAllEmployee();
    for (const employee of employees) {
      await this.updateEmployeeCache(employee);
    }

    this.logger.info('Employee cache synchronized');
  }
}
