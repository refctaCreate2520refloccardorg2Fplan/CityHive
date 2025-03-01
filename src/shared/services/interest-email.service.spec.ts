import { TestBed } from '@angular/core/testing';

import { InterestEmailService } from './interest-email.service';

describe('InterestEmailService', () => {
  let service: InterestEmailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InterestEmailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
