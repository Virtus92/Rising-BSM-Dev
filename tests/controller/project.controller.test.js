const projectController = require('../../controllers/project.controller');
const pool = require('../../services/db.service');
const exportService = require('../../services/export.service');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('../../services/export.service');
jest.mock('../../utils/formatters', () => ({
    formatDateSafely: jest.fn(date => date ? 'formatted-date' : null)
}));
jest.mock('../../utils/helpers', () => ({
    getProjektStatusInfo: jest.fn(status => {
        const statusMap = {
            'neu': { label: 'Neu', className: 'info' },
            'in_bearbeitung': { label: 'In Bearbeitung', className: 'warning' },
            'abgeschlossen': { label: 'Abgeschlossen', className: 'success' },
            'storniert': { label: 'Storniert', className: 'secondary' }
        };
        return statusMap[status] || { label: status, className: 'primary' };
    })
}));

describe('Project Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            query: {},
            body: {},
            params: {},
            session: {
                user: {
                    id: 1,
                    name: 'Test User'
                }
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            setHeader: jest.fn(),
            send: jest.fn()
        };
        next = jest.fn();
        
        // Reset mocks
        jest.clearAllMocks();
    });

    describe('getAllProjects', () => {
        it('should get all projects with default pagination', async () => {
            // Setup
            req.query = {};
            
            pool.query.mockResolvedValueOnce({
                rows: [
                    { id: 1, titel: 'Project 1', status: 'neu', start_datum: '2023-01-01' }
                ]
            });
            pool.query.mockResolvedValueOnce({
                rows: [{ total: '1' }]
            });

            // Execute
            await projectController.getAllProjects(req, res, next);

            // Assert
            expect(pool.query).toHaveBeenCalledTimes(2);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    projects: expect.any(Array),
                    pagination: expect.objectContaining({
                        current: 1,
                        limit: 20,
                        total: 1,
                        totalRecords: 1
                    })
                })
            );
        });

        it('should filter projects by status', async () => {
            // Setup
            req.query = { status: 'abgeschlossen' };
            
            pool.query.mockResolvedValueOnce({
                rows: []
            });
            pool.query.mockResolvedValueOnce({
                rows: [{ total: '0' }]
            });

            // Execute
            await projectController.getAllProjects(req, res, next);

            // Assert
            expect(pool.query).toHaveBeenCalledTimes(2);
            expect(pool.query.mock.calls[0][1]).toContain('abgeschlossen');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle errors', async () => {
            // Setup
            const error = new Error('Database error');
            pool.query.mockRejectedValueOnce(error);

            // Execute
            await projectController.getAllProjects(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getProjectById', () => {
        it('should get project by ID with related data', async () => {
            // Setup
            req.params = { id: '1' };
            
            pool.query.mockResolvedValueOnce({
                rows: [{ 
                    id: 1, 
                    titel: 'Test Project', 
                    status: 'neu',
                    start_datum: '2023-01-01'
                }]
            });
            pool.query.mockResolvedValueOnce({
                rows: [{ id: 1, titel: 'Meeting', termin_datum: '2023-01-10', status: 'geplant' }]
            });
            pool.query.mockResolvedValueOnce({
                rows: [{ id: 1, text: 'Test note', erstellt_am: '2023-01-02', benutzer_name: 'User' }]
            });

            // Execute
            await projectController.getProjectById(req, res, next);

            // Assert
            expect(pool.query).toHaveBeenCalledTimes(3);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    project: expect.any(Object),
                    appointments: expect.any(Array),
                    notes: expect.any(Array)
                })
            );
        });

        it('should return 404 when project not found', async () => {
            // Setup
            req.params = { id: '999' };
            
            pool.query.mockResolvedValueOnce({ rows: [] });

            // Execute
            await projectController.getProjectById(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Project with ID 999 not found',
                    statusCode: 404
                })
            );
        });
    });

    describe('createProject', () => {
        it('should create a new project', async () => {
            // Setup
            req.body = {
                titel: 'New Project',
                start_datum: '2023-01-15',
                kunde_id: 5,
                status: 'neu'
            };
            
            pool.query.mockResolvedValueOnce({ rows: [{ id: 10 }] });
            pool.query.mockResolvedValueOnce({});
            pool.query.mockResolvedValueOnce({});

            // Execute
            await projectController.createProject(req, res, next);

            // Assert
            expect(pool.query).toHaveBeenCalledTimes(3);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    projectId: 10
                })
            );
        });

        it('should validate required fields', async () => {
            // Setup
            req.body = { titel: 'Missing Start Date' };

            // Execute
            await projectController.createProject(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Title and start date are required fields',
                    statusCode: 400
                })
            );
        });
    });

    describe('updateProject', () => {
        beforeEach(() => {
            req.params = { id: '5' };
            req.body = {
                titel: 'Updated Project',
                start_datum: '2023-02-15'
            };
        });

        it('should update an existing project', async () => {
            // Setup
            pool.query.mockResolvedValueOnce({ rows: [{ id: 5 }] });
            pool.query.mockResolvedValueOnce({});
            pool.query.mockResolvedValueOnce({});

            // Execute
            await projectController.updateProject(req, res, next);

            // Assert
            expect(pool.query).toHaveBeenCalledTimes(3);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    projectId: '5'
                })
            );
        });

        it('should return 404 when project to update not found', async () => {
            // Setup
            pool.query.mockResolvedValueOnce({ rows: [] });

            // Execute
            await projectController.updateProject(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Project with ID 5 not found',
                    statusCode: 404
                })
            );
        });
    });

    describe('updateProjectStatus', () => {
        it('should update project status', async () => {
            // Setup
            req.body = {
                id: 3,
                status: 'abgeschlossen',
                note: 'Project completed successfully'
            };
            
            pool.query.mockResolvedValueOnce({});
            pool.query.mockResolvedValueOnce({});
            pool.query.mockResolvedValueOnce({});

            // Execute
            await projectController.updateProjectStatus(req, res, next);

            // Assert
            expect(pool.query).toHaveBeenCalledTimes(3);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    projectId: 3
                })
            );
        });

        it('should validate required fields', async () => {
            // Setup
            req.body = { id: 3 }; // Missing status

            // Execute
            await projectController.updateProjectStatus(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Project ID and status are required',
                    statusCode: 400
                })
            );
        });

        it('should validate status value', async () => {
            // Setup
            req.body = { id: 3, status: 'invalid_status' };

            // Execute
            await projectController.updateProjectStatus(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invalid status value',
                    statusCode: 400
                })
            );
        });
    });

    describe('exportProjects', () => {
        it('should export projects to Excel format', async () => {
            // Setup
            req.query = { 
                format: 'excel',
                status: 'abgeschlossen' 
            };
            
            pool.query.mockResolvedValueOnce({
                rows: [{ id: 1, titel: 'Project 1', status: 'abgeschlossen' }]
            });

            exportService.generateExport.mockResolvedValueOnce({
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                filename: 'projekte-export.xlsx',
                buffer: Buffer.from('test')
            });

            // Execute
            await projectController.exportProjects(req, res, next);

            // Assert
            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(exportService.generateExport).toHaveBeenCalledTimes(1);
            expect(res.setHeader).toHaveBeenCalledTimes(2);
            expect(res.send).toHaveBeenCalledWith(Buffer.from('test'));
        });

        it('should export projects to JSON format', async () => {
            // Setup
            req.query = { 
                format: 'json'
            };
            
            pool.query.mockResolvedValueOnce({
                rows: [{ id: 1, titel: 'Project 1' }]
            });

            const mockData = [{ id: 1, titel: 'Project 1' }];
            exportService.generateExport.mockResolvedValueOnce(mockData);

            // Execute
            await projectController.exportProjects(req, res, next);

            // Assert
            expect(res.json).toHaveBeenCalledWith(mockData);
        });
    });

    describe('addProjectNote', () => {
        beforeEach(() => {
            req.params = { id: '5' };
            req.body = { note: 'Test note content' };
        });
        
        it('should add a note to an existing project', async () => {
            // Setup
            pool.query.mockResolvedValueOnce({ rows: [{ id: 5 }] });
            pool.query.mockResolvedValueOnce({});
            pool.query.mockResolvedValueOnce({});

            // Execute
            await projectController.addProjectNote(req, res, next);

            // Assert
            expect(pool.query).toHaveBeenCalledTimes(3);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    projectId: '5',
                    message: 'Note added successfully'
                })
            );
        });

        it('should validate that note is not empty', async () => {
            // Setup
            req.body = { note: '' };

            // Execute
            await projectController.addProjectNote(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Note cannot be empty',
                    statusCode: 400
                })
            );
        });

        it('should return 404 when project not found', async () => {
            // Setup
            pool.query.mockResolvedValueOnce({ rows: [] });

            // Execute
            await projectController.addProjectNote(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Project with ID 5 not found',
                    statusCode: 404
                })
            );
        });
    });
});