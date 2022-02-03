import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credential.dto';
import { GetUser } from './get-user.decorator';
import { User } from './user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiCreatedResponse } from '@nestjs/swagger';



@Controller('user')
@ApiTags('유저 API')
export class AuthController {
    constructor( private authService: AuthService){}

    @Post('/signup')
    @ApiOperation({ summary: '회원가입 API', description: '이메일, 비밀번호, 닉네임 입력' })
    @ApiCreatedResponse({ description: '유저를 생성합니다', type: User })
    signUp(@Body(ValidationPipe) authcredentialsDto: AuthCredentialsDto): Promise<void> {
        return this.authService.signUp(authcredentialsDto);
    }

    @Post('/signin')
    signIn(@Body() authCredentialsDto: AuthCredentialsDto) {
        return this.authService.signIn(authCredentialsDto)
    }

    @Post('/test')
    @UseGuards(AuthGuard())
    test(@GetUser() user: User) {
        console.log('user', user);
    } 
}
