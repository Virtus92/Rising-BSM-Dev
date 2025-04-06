import { IProjectService } from '../interfaces/IProjectService';
import { IProjectRepository } from '../interfaces/IProjectRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';
import { IValidationService } from '../interfaces/IValidationService';

/**
 * Service für die Verwaltung von Projekten
 */
export class ProjectService implements IProjectService {
  constructor(
    private projectRepository: IProjectRepository,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler,
    private validationService: IValidationService
  ) {}

  /**
   * Erstellt ein neues Projekt
   */
  async create(data: any, userId: number, userName: string) {
    try {
      this.logger.debug('ProjectService.create', { title: data.title });
      
      // Validieren der Eingabedaten
      const validationResult = this.validateProjectData(data);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Metadaten hinzufügen
      const projectData = {
        ...data,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: data.status || 'new'
      };
      
      // Projekt erstellen
      const project = await this.projectRepository.create(projectData);
      
      // Notiz hinzufügen, wenn vorhanden
      if (data.note) {
        await this.projectRepository.addNote(
          project.id,
          userId,
          userName,
          data.note
        );
      }
      
      return project;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectService.create');
    }
  }

  /**
   * Findet ein Projekt anhand seiner ID
   */
  async findById(id: number) {
    try {
      this.logger.debug('ProjectService.findById', { id });
      
      const project = await this.projectRepository.findById(id);
      if (!project) {
        throw this.errorHandler.createError('Projekt nicht gefunden', 404);
      }
      
      return project;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectService.findById');
    }
  }

  /**
   * Findet alle Projekte mit optionaler Filterung
   */
  async findAll(filters?: any) {
    try {
      this.logger.debug('ProjectService.findAll', filters);
      
      return await this.projectRepository.findAll(filters);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectService.findAll');
    }
  }

  /**
   * Findet Projekte nach Kunde
   */
  async findByCustomer(customerId: number) {
    try {
      this.logger.debug('ProjectService.findByCustomer', { customerId });
      
      return await this.projectRepository.findByCustomer(customerId);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectService.findByCustomer');
    }
  }

  /**
   * Findet Projekte nach Service
   */
  async findByService(serviceId: number) {
    try {
      this.logger.debug('ProjectService.findByService', { serviceId });
      
      return await this.projectRepository.findByService(serviceId);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectService.findByService');
    }
  }

  /**
   * Aktualisiert ein Projekt
   */
  async update(id: number, data: any, userId: number, userName: string) {
    try {
      this.logger.debug('ProjectService.update', { id });
      
      // Überprüfen, ob das Projekt existiert
      const existingProject = await this.projectRepository.findById(id, false);
      if (!existingProject) {
        throw this.errorHandler.createError('Projekt nicht gefunden', 404);
      }
      
      // Validieren der Eingabedaten
      const validationResult = this.validateProjectData(data, true);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Notiz extrahieren, falls vorhanden
      const { note, ...updateData } = data;
      
      // Metadaten aktualisieren
      const projectData = {
        ...updateData,
        updatedAt: new Date()
      };
      
      // Projekt aktualisieren
      const project = await this.projectRepository.update(id, projectData);
      
      // Notiz hinzufügen, wenn vorhanden
      if (note) {
        await this.projectRepository.addNote(
          project.id,
          userId,
          userName,
          note
        );
      }
      
      return project;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectService.update');
    }
  }

  /**
   * Löscht ein Projekt
   */
  async delete(id: number) {
    try {
      this.logger.debug('ProjectService.delete', { id });
      
      // Überprüfen, ob das Projekt existiert
      const existingProject = await this.projectRepository.findById(id, false);
      if (!existingProject) {
        throw this.errorHandler.createError('Projekt nicht gefunden', 404);
      }
      
      // Projekt löschen (oder als gelöscht markieren)
      return await this.projectRepository.delete(id);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectService.delete');
    }
  }

  /**
   * Sucht nach Projekten basierend auf einem Suchbegriff
   */
  async search(searchTerm: string) {
    try {
      this.logger.debug('ProjectService.search', { searchTerm });
      
      if (!searchTerm || searchTerm.length < 2) {
        throw this.errorHandler.createError('Suchbegriff muss mindestens 2 Zeichen enthalten', 400);
      }
      
      return await this.projectRepository.search(searchTerm);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectService.search');
    }
  }

  /**
   * Fügt eine Notiz zu einem Projekt hinzu
   */
  async addNote(projectId: number, userId: number, userName: string, text: string) {
    try {
      this.logger.debug('ProjectService.addNote', { projectId, userId });
      
      // Überprüfen, ob das Projekt existiert
      const existingProject = await this.projectRepository.findById(projectId, false);
      if (!existingProject) {
        throw this.errorHandler.createError('Projekt nicht gefunden', 404);
      }
      
      // Validierung des Notiz-Textes
      if (!text) {
        throw this.errorHandler.createError('Notiztext ist erforderlich', 400);
      }
      
      if (text.trim().length === 0) {
        throw this.errorHandler.createError('Notiztext darf nicht leer sein', 400);
      }
      
      // Notiz hinzufügen
      return await this.projectRepository.addNote(projectId, userId, userName, text);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectService.addNote');
    }
  }

  /**
   * Holt Notizen für ein Projekt
   */
  async getProjectNotes(projectId: number) {
    try {
      this.logger.debug('ProjectService.getProjectNotes', { projectId });
      
      // Überprüfen, ob das Projekt existiert
      const existingProject = await this.projectRepository.findById(projectId, false);
      if (!existingProject) {
        throw this.errorHandler.createError('Projekt nicht gefunden', 404);
      }
      
      return await this.projectRepository.getProjectNotes(projectId);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectService.getProjectNotes');
    }
  }

  /**
   * Validiert Projektdaten für die Erstellung/Aktualisierung
   */
  validateProjectData(data: any, isUpdate = false): { isValid: boolean; errors?: any } {
    const validationRules = {
      title: {
        required: !isUpdate,
        type: 'string',
        minLength: 3,
        maxLength: 200
      },
      customerId: {
        type: 'number',
        required: !isUpdate
      },
      serviceId: {
        type: 'number',
        required: !isUpdate
      },
      startDate: {
        type: 'date'
      },
      endDate: {
        type: 'date'
      },
      amount: {
        type: 'number',
        min: 0
      },
      description: {
        type: 'string'
      },
      status: {
        type: 'string',
        enum: ['new', 'in_progress', 'on_hold', 'completed', 'cancelled']
      }
    };
    
    return this.validationService.validate(data, validationRules);
  }

  /**
   * Holt Projektstatistiken (nach Status, Service, etc.)
   */
  async getProjectStatistics() {
    try {
      this.logger.debug('ProjectService.getProjectStatistics');
      
      const statusCounts = await this.projectRepository.countByStatus();
      
      // Weitere Statistiken könnten hier berechnet werden
      
      return {
        statusCounts
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectService.getProjectStatistics');
    }
  }

  /**
   * Holt aktuelle Projekte für das Dashboard
   */
  async getRecentProjects(limit = 5) {
    try {
      this.logger.debug('ProjectService.getRecentProjects', { limit });
      
      return await this.projectRepository.getRecentProjects(limit);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectService.getRecentProjects');
    }
  }
}
