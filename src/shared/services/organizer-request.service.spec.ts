import { TestBed } from '@angular/core/testing';

import { OrganizerRequestService } from './organizer-request.service';

describe('OrganizerRequestService', () => {
  let service: OrganizerRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganizerRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
