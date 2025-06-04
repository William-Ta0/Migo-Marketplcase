const mongoose = require('mongoose');
const User = require('../../../backend/models/User');
const Service = require('../../../backend/models/Service');

describe('Service Model', () => {
  // Helper function to check if we should skip database tests
  const skipIfNoConnection = () => {
    if (!testUtils.isDbConnected()) {
      console.warn('⏭️  Skipping test - no database connection');
      return true;
    }
    return false;
  };

  afterEach(async () => {
    // Only clean up if connected
    if (testUtils.isDbConnected()) {
      try {
        await Service.deleteMany({});
        await User.deleteMany({});
      } catch (error) {
        console.warn('⚠️  Error cleaning up test data:', error.message);
      }
    }
  });

  describe('Schema Validation', () => {
    test('should create a valid service with required fields', async () => {
      if (skipIfNoConnection()) return;

      // Create vendor inline instead of beforeEach
      const testVendor = await User.create(testUtils.createMockVendor());
      const serviceData = testUtils.createMockService(testVendor._id);
      const service = new Service(serviceData);
      const savedService = await service.save();

      expect(savedService._id).toBeDefined();
      expect(savedService.title).toBe(serviceData.title);
      expect(savedService.description).toBe(serviceData.description);
      expect(savedService.vendor.toString()).toBe(testVendor._id.toString());
      expect(savedService.category.name).toBe(serviceData.category.name);
      expect(savedService.pricing.type).toBe(serviceData.pricing.type);
      expect(savedService.isActive).toBe(true);
    });

    test('should fail to create service without required fields', async () => {
      if (skipIfNoConnection()) return;

      const service = new Service({});
      let error;
      
      try {
        await service.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.vendor).toBeDefined();
    });

    test('should enforce description maxlength', async () => {
      if (skipIfNoConnection()) return;

      const testVendor = await User.create(testUtils.createMockVendor());
      const longDescription = 'a'.repeat(2001);
      const serviceData = testUtils.createMockService(testVendor._id, {
        description: longDescription
      });
      
      const service = new Service(serviceData);
      let error;
      
      try {
        await service.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.description).toBeDefined();
    });

    test('should enforce shortDescription maxlength', async () => {
      if (skipIfNoConnection()) return;

      const longShortDescription = 'a'.repeat(201);
      const serviceData = testUtils.createMockService(testVendor._id, {
        shortDescription: longShortDescription
      });
      
      const service = new Service(serviceData);
      let error;
      
      try {
        await service.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.shortDescription).toBeDefined();
    });

    test('should trim title whitespace', async () => {
      if (skipIfNoConnection()) return;

      const testVendor = await User.create(testUtils.createMockVendor());
      const serviceData = testUtils.createMockService(testVendor._id, {
        title: '  Test Service  '
      });
      
      const service = await Service.create(serviceData);
      expect(service.title).toBe('Test Service');
    });
  });

  describe('Pricing Validation', () => {
    test('should validate pricing type enum', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id, {
        pricing: {
          type: 'invalid-type',
          amount: 100
        }
      });
      
      const service = new Service(serviceData);
      let error;
      
      try {
        await service.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors['pricing.type']).toBeDefined();
    });

    test('should require amount for fixed pricing', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id, {
        pricing: {
          type: 'fixed'
          // amount missing
        }
      });
      
      const service = new Service(serviceData);
      let error;
      
      try {
        await service.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });

    test('should require amount for hourly pricing', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id, {
        pricing: {
          type: 'hourly'
          // amount missing
        }
      });
      
      const service = new Service(serviceData);
      let error;
      
      try {
        await service.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });

    test('should allow package pricing without amount', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id, {
        pricing: {
          type: 'package',
          packages: [{
            name: 'Basic',
            description: 'Basic package',
            price: 50,
            features: ['Feature 1'],
            deliveryTime: 7
          }]
        }
      });
      
      const service = await Service.create(serviceData);
      expect(service.pricing.type).toBe('package');
      expect(service.pricing.packages).toHaveLength(1);
    });

    test('should allow custom pricing with note', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id, {
        pricing: {
          type: 'custom',
          customNote: 'Contact for pricing'
        }
      });
      
      const service = await Service.create(serviceData);
      expect(service.pricing.type).toBe('custom');
      expect(service.pricing.customNote).toBe('Contact for pricing');
    });

    test('should enforce customNote maxlength', async () => {
      if (skipIfNoConnection()) return;

      const longNote = 'a'.repeat(501);
      const serviceData = testUtils.createMockService(testVendor._id, {
        pricing: {
          type: 'custom',
          customNote: longNote
        }
      });
      
      const service = new Service(serviceData);
      let error;
      
      try {
        await service.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });
  });

  describe('Location Validation', () => {
    test('should validate location type enum', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id, {
        location: {
          type: 'invalid-type'
        }
      });
      
      const service = new Service(serviceData);
      let error;
      
      try {
        await service.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });

    test('should set default location type', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id);
      delete serviceData.location.type;
      
      const service = await Service.create(serviceData);
      expect(service.location.type).toBe('both');
    });

    test('should set default service radius', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id);
      delete serviceData.location.serviceArea;
      
      const service = await Service.create(serviceData);
      expect(service.location.serviceArea.radius).toBe(25);
    });
  });

  describe('Availability Validation', () => {
    test('should validate availability day enum', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id, {
        availability: {
          schedule: [{
            day: 'invalid-day',
            isAvailable: true,
            hours: {
              start: '09:00',
              end: '17:00'
            }
          }]
        }
      });
      
      const service = new Service(serviceData);
      let error;
      
      try {
        await service.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });

    test('should set default timezone', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id, {
        availability: {
          schedule: [{
            day: 'monday',
            isAvailable: true
          }]
        }
      });
      
      const service = await Service.create(serviceData);
      expect(service.availability.timezone).toBe('America/New_York');
    });

    test('should set default lead time', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id);
      
      const service = await Service.create(serviceData);
      expect(service.availability.leadTime).toBe(1);
    });
  });

  describe('Images Handling', () => {
    test('should store multiple images with metadata', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id, {
        images: [
          {
            url: 'https://example.com/image1.jpg',
            alt: 'Service image 1',
            isPrimary: true
          },
          {
            url: 'https://example.com/image2.jpg',
            alt: 'Service image 2',
            isPrimary: false
          }
        ]
      });
      
      const service = await Service.create(serviceData);
      expect(service.images).toHaveLength(2);
      expect(service.images[0].isPrimary).toBe(true);
      expect(service.images[1].isPrimary).toBe(false);
    });
  });

  describe('Estimated Duration', () => {
    test('should validate duration unit enum', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id, {
        estimatedDuration: {
          min: 1,
          max: 5,
          unit: 'invalid-unit'
        }
      });
      
      const service = new Service(serviceData);
      let error;
      
      try {
        await service.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });

    test('should set default duration unit', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id, {
        estimatedDuration: {
          min: 1,
          max: 5
        }
      });
      
      const service = await Service.create(serviceData);
      expect(service.estimatedDuration.unit).toBe('hours');
    });
  });

  describe('Default Values', () => {
    test('should set default values for optional fields', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id);
      const service = await Service.create(serviceData);

      expect(service.isActive).toBe(true);
      expect(service.isPromoted).toBe(false);
      expect(service.stats.views).toBe(0);
      expect(service.stats.inquiries).toBe(0);
      expect(service.stats.bookings).toBe(0);
      expect(service.stats.rating.average).toBe(0);
      expect(service.stats.rating.count).toBe(0);
      expect(service.pricing.currency).toBe('USD');
    });
  });

  describe('Vendor Relationship', () => {
    test('should populate vendor information', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id);
      const service = await Service.create(serviceData);
      
      const populatedService = await Service.findById(service._id).populate('vendor');
      expect(populatedService.vendor).toBeDefined();
      expect(populatedService.vendor._id.toString()).toBe(testVendor._id.toString());
      expect(populatedService.vendor.name).toBe(testVendor.name);
    });

    test('should fail with invalid vendor reference', async () => {
      if (skipIfNoConnection()) return;

      const invalidVendorId = new mongoose.Types.ObjectId();
      const serviceData = testUtils.createMockService(invalidVendorId);
      
      // This should create the service but vendor won't exist when populated
      const service = await Service.create(serviceData);
      const populatedService = await Service.findById(service._id).populate('vendor');
      expect(populatedService.vendor).toBeNull();
    });
  });

  describe('Search Functionality', () => {
    test('should have text indexes for search', async () => {
      if (skipIfNoConnection()) return;

      const service1 = await Service.create(testUtils.createMockService(testVendor._id, {
        title: 'Web Development Service',
        description: 'Professional web development',
        tags: ['web', 'development', 'react']
      }));

      const service2 = await Service.create(testUtils.createMockService(testVendor._id, {
        title: 'Mobile App Development',
        description: 'Native mobile applications',
        tags: ['mobile', 'app', 'ios', 'android']
      }));

      // Note: Text search requires actual MongoDB with text indexes
      // This is a basic test to ensure the fields are searchable
      const webServices = await Service.find({
        $or: [
          { title: /web/i },
          { description: /web/i },
          { tags: 'web' }
        ]
      });

      expect(webServices).toHaveLength(1);
      expect(webServices[0].title).toBe('Web Development Service');
    });
  });

  describe('Category and Subcategory', () => {
    test('should require category information', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id);
      delete serviceData.category;
      
      const service = new Service(serviceData);
      let error;
      
      try {
        await service.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });

    test('should store category and subcategory information', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id, {
        category: {
          name: 'Technology',
          slug: 'technology'
        },
        subcategory: {
          name: 'Web Development',
          description: 'Building websites and web applications'
        }
      });
      
      const service = await Service.create(serviceData);
      expect(service.category.name).toBe('Technology');
      expect(service.category.slug).toBe('technology');
      expect(service.subcategory.name).toBe('Web Development');
      expect(service.subcategory.description).toBe('Building websites and web applications');
    });
  });

  describe('Stats Tracking', () => {
    test('should track service statistics', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id);
      const service = await Service.create(serviceData);

      // Simulate updating stats
      service.stats.views = 10;
      service.stats.inquiries = 3;
      service.stats.bookings = 1;
      service.stats.rating.average = 4.5;
      service.stats.rating.count = 2;

      const updatedService = await service.save();
      
      expect(updatedService.stats.views).toBe(10);
      expect(updatedService.stats.inquiries).toBe(3);
      expect(updatedService.stats.bookings).toBe(1);
      expect(updatedService.stats.rating.average).toBe(4.5);
      expect(updatedService.stats.rating.count).toBe(2);
    });
  });

  describe('Timestamps', () => {
    test('should automatically add timestamps', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id);
      const service = await Service.create(serviceData);

      expect(service.createdAt).toBeDefined();
      expect(service.updatedAt).toBeDefined();
      expect(service.createdAt).toBeInstanceOf(Date);
      expect(service.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      if (skipIfNoConnection()) return;

      const serviceData = testUtils.createMockService(testVendor._id);
      const service = await Service.create(serviceData);
      const originalUpdatedAt = service.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      service.title = 'Updated Service Title';
      const updatedService = await service.save();

      expect(updatedService.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Quick Tests (Non-DB)', () => {
    test('should have Service model available', () => {
      expect(Service).toBeDefined();
      expect(typeof Service).toBe('function');
    });
    
    test('should have required schema fields', () => {
      const schema = Service.schema;
      expect(schema.paths.title).toBeDefined();
      expect(schema.paths.description).toBeDefined();
      expect(schema.paths.vendor).toBeDefined();
      expect(schema.paths.pricing).toBeDefined();
    });
  });
}); 