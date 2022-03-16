import { EntityRepository, FindRelationsNotFoundError, Repository } from "typeorm";
import { Users } from "src/users/users.entity";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { PasswordDto } from "./dto/password.dto";
import * as bcrypt from "bcryptjs";
import { empty } from "rxjs";

@EntityRepository(Users)
export class UsersRepository extends Repository<Users> {
    async findByUserId(userId: number){
        return await this.createQueryBuilder("user")
            .where("user.userId =:userId", {userId})
            .andWhere("user.userStatus =:status", {status: true})
            .getOne();
    }
    
    async findByUserIdWithDeleted(userId: number){
        return await this.createQueryBuilder("user")
            .where("user.userId =:userId", {userId})
            .getOne();
    }

    async getAllUsers(): Promise<Users[]> {
        return await this.createQueryBuilder("user")
            .select([
                "user.userId",
                "user.nickname",
                "user.breakUpdate",
                "user.profileImage"
            ])
            .where("user.userStatus =:status", {status: true})
            .getMany();
    }

    async updateProfile(userId: number, updateProfileDto: UpdateProfileDto){
        const { nickname } = updateProfileDto;
        await this.update({userId}, {nickname});
    }

    async updatePassword(userId: number, passwordDto: PasswordDto){
        const { password } = passwordDto;
        const salt = await bcrypt.genSalt();         // salt 생성 - 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, salt);
        await this.update({userId}, {password: hashedPassword});
    }

    async updateProfileImage(userId: number, imageUrl: string){
        await this.update({userId}, {profileImage: imageUrl});
    }

    async deleteUser(userId: number){
        
        const user = await this.findOne(userId);
        user.userStatus = false;
        user.email = null;
        
        await this.save(user);
        
        // await this.update({userId}, {userStatus: false});
    }

    // 작성한 글 가져오기 _ 카테고리명, 제목, 닉네임, 내용, n시간전, 이미지 개수
    async getAllBoardsByUserId(userId: number){
        return await this.createQueryBuilder("user") 
            .innerJoinAndSelect("user.boards","boards") // user 테이블에 boards 게시물 join
            .leftJoinAndSelect("boards.images","images", "images.imageStatus=:status", {status:true}) // board 테이블에 images join
            .select([
                "user.nickname AS nickname", 
                "boards.categoryId AS categoryId", 
                "boards.postTitle AS postTitle", 
                "boards.postCreated AS createdAt", 
                "boards.postContent AS postContent",
                "COUNT(images.originalName) AS imageCnt"
            ])
            .where("boards.userId=:userId", {userId})
            .andWhere("boards.postStatus=:status", {status: true}) // 게시글이 삭제되지 않은 경우만
            .groupBy("boards.boardId")
            .getRawMany(); 
        
    }

    // 댓글을 단 게시물 가져오기
    async getAllBoardsByComments(userId: number){  
        return await this.createQueryBuilder("user") 
            .innerJoinAndSelect("user.boards","boards") // (게시물이 있는 user만) user 테이블에 boards join
            .innerJoinAndSelect("boards.comments","comments") // board 테이블에 comments join (댓글이 없는 게시글이면 안세도 되니까 inner)
            .leftJoinAndSelect("boards.images","images", "images.imageStatus=:status", {status:true}) // board 테이블에 images join
            .select([
                "user.nickname AS nickname",
                "boards.categoryId AS categoryId", 
                "boards.postTitle AS postTitle", 
                "boards.postCreated AS createdAt", 
                "boards.postContent AS postContent",
                "COUNT(images.originalName) AS imageCnt"
            ])
            .where("comments.userId=:userId", {userId}) // 댓글 단 사람 id == userId 일 경우만
            .andWhere("comments.commentStatus=:status", {status: true}) // 댓글이 삭제되지 않은 경우만
            .groupBy("boards.boardId")
            .getRawMany();  
    }

    // 북마크 한 게시물 가져오기
    async getAllBoardsByBookmark(userId: number){  
        return await this.createQueryBuilder("user")
            .innerJoinAndSelect("user.boards", "boards") // user테이블에 bookmarks join (북마크가 있는 애들만 - inner)
            .innerJoinAndSelect("boards.bookmarks","bookmarks") // (게시물이 있는 경우에만 bookmarks)
            .leftJoinAndSelect("boards.images","images", "images.imageStatus=:status", {status:true}) // board 테이블에 images join
            .select([
                "user.nickname AS nickname",
                "boards.categoryId AS categoryId", 
                "boards.postTitle AS postTitle", 
                "boards.postCreated AS createdAt", 
                "boards.postContent AS postContent",
                "COUNT(images.originalName) AS imageCnt"
            ])
            .where("bookmarks.userId=:userId", {userId}) // 이은 데이터에서 댓글단 사용자가 userId인 애만
            .andWhere("bookmarks.bookmarkStatus=:status", {status: true}) // 북마크 취소하지 않은 경우만
            .groupBy("boards.boardId")
            .getRawMany();   
    }
}
