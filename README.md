1. start: npm run start
2. build:
+ npm run build
3. deploy:
  
  3.1: tạo solution (nếu chưa có)
  + mkdir solution
  + cd solution
  + pac solution init --publisher-name <nameOfUserPublic> --phblisher-prefix <name>
  + pac solution add-refenrence --path ..
    
  3.2: deloy
  + msbuild /t:restore
  + msbuild /t:build /p:Configuration=release
    => Solution: bin\release\solution.zip generated.
