import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'admin' } }),
      }),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['admin']);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'admin' } }),
      }),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['admin']);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'participant' } }),
      }),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
