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
    const { nik, name } = employee;
    const cachedEmployee = await this.employeeCache.findUnique({
      where: { nik },
    });

    try {
      if (cachedEmployee && name !== cachedEmployee.name)
        await this.employeeCache.update({
          where: { nik },
          data: { name },
        });
      else if (!cachedEmployee)
        await this.employeeCache.create({
          data: { nik, name },
        });
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  public async synchronizeEmployeeCache() {
    this.logger.info('Synchronizing employee cache');

    const employees = await getAllEmployee();
    const filteredEmployees = employees.filter(
      (employee) => employee.position === 'OnSite',
    );

    for (const employee of filteredEmployees) {
      await this.updateEmployeeCache(employee);
    }
    this.logger.info('Employee cache synchronized');
  }
}
