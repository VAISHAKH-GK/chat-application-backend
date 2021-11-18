module.exports = {
    getTime: () => {
        var time = new Date();
        var timeh = time.getHours();
        var timem = time.getMinutes();
        if(timeh>12){
            timeh -=12;
            var ap = ' pm'
        }else{
            var ap = ' am';
        }
        function leftFillNum(num) {
            if (num<10){
                num = '0'+num;
                return num;
            }else{
                return num;
            }
        }
        var timeh = leftFillNum(timeh);
        var timem = leftFillNum(timem);
        time = timeh + ':' + timem + ap;
        return time; 
    }
}