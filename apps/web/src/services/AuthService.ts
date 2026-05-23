import { BaseService } from "./BaseService";
import bcrypt from "bcryptjs";
import { AuthError, ValidationError } from "@/lib/errors";

const MIN_PASSWORD_LENGTH = 8;
const MIN_USERNAME_LENGTH = 3;

export class AuthService extends BaseService {
  async signup(params: {
    email: string;
    password: string;
    name: string;
    username: string;
    phone?: string;
    dateOfBirth?: string;
    bio?: string;
    gender?: string;
  }) {
    const { email, password, name, username } = params;

    if (!email || !password || !name || !username) {
      throw new ValidationError("البريد الإلكتروني وكلمة المرور والاسم مطلوبون");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(
        `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError("البريد الإلكتروني غير صالح");
    }
    if (username.length < MIN_USERNAME_LENGTH) {
      throw new ValidationError(
        `اسم المستخدم يجب أن يكون ${MIN_USERNAME_LENGTH} أحرف على الأقل`
      );
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new ValidationError("اسم المستخدم يمكن أن يحتوي فقط على أحرف وأرقام وشرطة سفلية");
    }

    const existingEmail = await this.db.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ValidationError("البريد الإلكتروني مستخدم بالفعل");
    }

    const existingUsername = await this.db.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new ValidationError("اسم المستخدم مستخدم بالفعل");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await this.db.user.create({
      data: {
        email,
        name,
        username,
        phone: params.phone || null,
        dateOfBirth: params.dateOfBirth || null,
        bio: params.bio || null,
        gender: params.gender || null,
        hashedPassword,
      },
    });

    await this.db.channel.create({
      data: {
        name,
        avatar: "/default-avatar.svg",
        userId: user.id,
      },
    });

    return user;
  }

  async signin(email: string, password: string) {
    if (!email || !password) {
      throw new ValidationError("البريد الإلكتروني وكلمة المرور مطلوبان");
    }

    const user = await this.db.user.findUnique({ where: { email } });
    if (!user || !user.hashedPassword) {
      throw new AuthError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) {
      throw new AuthError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }

    return user;
  }
}

export const authService = new AuthService();
