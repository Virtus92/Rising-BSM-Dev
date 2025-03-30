import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { CryptoHelper } from '../../../src/utils/crypto-helper.js';


describe('CryptoHelper', () => {
    describe('hashPassword', () => {
        it('should hash a password', async () => {
            const password = 'testPassword123';
            const hashedPassword = await CryptoHelper.hashPassword(password);
            
            expect(hashedPassword).not.toBe(password);
            expect(typeof hashedPassword).toBe('string');
            expect(hashedPassword.length).toBeGreaterThan(0);
        });
        
        it('should use provided salt rounds', async () => {
            const password = 'testPassword123';
            const bcryptHashSpy = jest.spyOn(bcrypt, 'hash');
            
            await CryptoHelper.hashPassword(password, 12);
            
            expect(bcryptHashSpy).toHaveBeenCalledWith(password, 12);
            bcryptHashSpy.mockRestore();
        });
    });
    
    describe('verifyPassword', () => {
        it('should verify a correct password', async () => {
            const password = 'testPassword123';
            const hashedPassword = await CryptoHelper.hashPassword(password);
            
            const isValid = await CryptoHelper.verifyPassword(password, hashedPassword);
            
            expect(isValid).toBe(true);
        });
        
        it('should reject an incorrect password', async () => {
            const password = 'testPassword123';
            const wrongPassword = 'wrongPassword';
            const hashedPassword = await CryptoHelper.hashPassword(password);
            
            const isValid = await CryptoHelper.verifyPassword(wrongPassword, hashedPassword);
            
            expect(isValid).toBe(false);
        });
    });
    
    describe('generateJwtToken', () => {
        it('should generate a valid JWT token with payload', () => {
            const payload = { userId: '123', role: 'user' };
            const token = CryptoHelper.generateJwtToken(payload);
            
            expect(typeof token).toBe('string');
            expect(token.split('.').length).toBe(3); // JWT has 3 parts
        });
        
        it('should use custom expiration and secret if provided', () => {
            const payload = { userId: '123' };
            const options = { expiresIn: '7d', secret: 'custom-secret' };
            const jwtSignSpy = jest.spyOn(jwt, 'sign');
            
            CryptoHelper.generateJwtToken(payload, options);
            
            expect(jwtSignSpy).toHaveBeenCalledWith(payload, 'custom-secret', { expiresIn: '7d' });
            jwtSignSpy.mockRestore();
        });
    });
    
    describe('verifyJwtToken', () => {
        it('should verify and decode a valid token', () => {
            const payload = { userId: '123', role: 'user' };
            const token = CryptoHelper.generateJwtToken(payload);
            
            const decodedPayload = CryptoHelper.verifyJwtToken(token);
            
            expect(decodedPayload).toHaveProperty('userId', '123');
            expect(decodedPayload).toHaveProperty('role', 'user');
        });
        
        it('should throw an error for an invalid token', () => {
            const invalidToken = 'invalid.token.string';
            
            expect(() => {
                CryptoHelper.verifyJwtToken(invalidToken);
            }).toThrow();
        });
    });
    
    describe('generateRandomToken', () => {
        it('should generate a random token with default length', () => {
            const token = CryptoHelper.generateRandomToken();
            
            expect(typeof token).toBe('string');
            expect(token.length).toBe(64); // 32 bytes = 64 hex chars
        });
        
        it('should generate a token with custom length', () => {
            const token = CryptoHelper.generateRandomToken(16);
            
            expect(token.length).toBe(32); // 16 bytes = 32 hex chars
        });
        
        it('should generate different tokens on each call', () => {
            const token1 = CryptoHelper.generateRandomToken();
            const token2 = CryptoHelper.generateRandomToken();
            
            expect(token1).not.toBe(token2);
        });
    });
    
    describe('hashToken', () => {
        it('should hash a token consistently', () => {
            const token = 'test-token';
            const hash1 = CryptoHelper.hashToken(token);
            const hash2 = CryptoHelper.hashToken(token);
            
            expect(hash1).toBe(hash2);
            expect(hash1).not.toBe(token);
        });
    });
    
    describe('calculateExpirationDate', () => {
        beforeEach(() => {
            jest.useFakeTimers().setSystemTime(new Date('2023-01-01T00:00:00Z'));
        });
        
        afterEach(() => {
            jest.useRealTimers();
        });
        
        it('should calculate expiration date for seconds', () => {
            const expDate = CryptoHelper.calculateExpirationDate('30s');
            const expected = new Date('2023-01-01T00:00:30Z');
            expect(expDate.getTime()).toBe(expected.getTime());
        });
        
        it('should calculate expiration date for minutes', () => {
            const expDate = CryptoHelper.calculateExpirationDate('5m');
            const expected = new Date('2023-01-01T00:05:00Z');
            expect(expDate.getTime()).toBe(expected.getTime());
        });
        
        it('should calculate expiration date for hours', () => {
            const expDate = CryptoHelper.calculateExpirationDate('2h');
            const expected = new Date('2023-01-01T02:00:00Z');
            expect(expDate.getTime()).toBe(expected.getTime());
        });
        
        it('should calculate expiration date for days', () => {
            const expDate = CryptoHelper.calculateExpirationDate('3d');
            const expected = new Date('2023-01-04T00:00:00Z');
            expect(expDate.getTime()).toBe(expected.getTime());
        });
        
        it('should use default expiration (1 day) for invalid unit', () => {
            const expDate = CryptoHelper.calculateExpirationDate('7x');
            const expected = new Date('2023-01-02T00:00:00Z');
            expect(expDate.getTime()).toBe(expected.getTime());
        });
    });
});