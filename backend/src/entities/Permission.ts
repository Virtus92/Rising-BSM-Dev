export class Permission {
    id: number;
    name: string;
    description: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
  
    constructor(data: Partial<Permission> = {}) {
      this.id = data.id || 0;
      this.name = data.name || '';
      this.description = data.description || '';
      this.category = data.category || 'general';
      this.createdAt = data.createdAt || new Date();
      this.updatedAt = data.updatedAt || new Date();
    }
  }
  // backend/src/middleware/AuthMiddleware.ts - Modified authorization middleware
 
  
  // Backend schema modification for Prisma (to add in prisma/schema.prisma)
  /*
  model Permission {
    id          Int      @id @default(autoincrement())
    name        String   @unique
    description String?
    category    String
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    roles       RolePermission[]
  }
  
  model Role {
    id          Int               @id @default(autoincrement())
    name        String            @unique
    description String?
    isSystem    Boolean           @default(false)
    createdAt   DateTime          @default(now())
    updatedAt   DateTime          @updatedAt
    createdBy   Int?
    updatedBy   Int?
    permissions RolePermission[]
    users       UserRole[]
  }
  
  model RolePermission {
    id           Int        @id @default(autoincrement())
    roleId       Int
    permissionId Int
    createdAt    DateTime   @default(now())
    role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
    permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
    @@unique([roleId, permissionId])
  }
  
  model UserRole {
    id        Int      @id @default(autoincrement())
    userId    Int
    roleId    Int
    createdAt DateTime @default(now())
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
    @@unique([userId, roleId])
  }
  */