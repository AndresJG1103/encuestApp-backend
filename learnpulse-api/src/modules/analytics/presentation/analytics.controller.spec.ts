import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from '../application/analytics.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const mockAnalyticsService = {
    getDashboardMetrics: jest.fn().mockResolvedValue({
      activeEmployees: 10,
      totalSessions: 50,
      totalRevenue: '$4.2M',
      systemHealth: '99.9%',
      recentActivity: [],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return dashboard metrics', async () => {
      const tenantId = 'test-tenant-id';
      const result = await controller.getDashboard(tenantId);
      expect(result).toEqual({
        activeEmployees: 10,
        totalSessions: 50,
        totalRevenue: '$4.2M',
        systemHealth: '99.9%',
        recentActivity: [],
      });
      expect(service.getDashboardMetrics).toHaveBeenCalledWith(tenantId);
    });
  });
});
