const colors = [
    '#A7EDED', '#96E8E8', '#83E4E4', '#5ADBDB', '#31D2D2', '#30CCCC', '#31C2C2', '#2CB9B9', '#2AAFAF', '#FF8ADE',
    '#FF79DA', '#FB5ECF', '#EE4AC0', '#DF40B2', '#D246AC', '#C43A9E', '#B42E8F', '#9F237D', '#BFEB61', '#AEE044',
    '#A5D83A', '#99CB2F', '#8EBF23', '#84B321', '#79A51B', '#6A9314', '#597D0D', '#89D5FF', '#6FC4F4', '#5EB6E8',
    '#4EA7DA', '#439BCD', '#3093CA', '#2C8CC1', '#2D86B9', '#2A7FAF', '#FF8B8B', '#FF7373', '#F86060', '#EB4B4B',
    '#DF4040', '#D63A3A', '#C42D2D', '#B12525', '#9F2323', '#A8EDA7', '#83E381', '#5DDD6A', '#49CC56', '#02BD4D',
    '#04B149', '#0CA448', '#109544', '#0D7D39', '#81B3FF', '#6FA8FF', '#5795F4', '#4989EC', '#3F80E3', '#3172D5',
    '#316BC2', '#2C64B9', '#2A57AF', '#FFC997', '#FFBA7B', '#FFB26A', '#FFA858', '#FF9B3F', '#F0913A', '#D28529',
    '#C07733', '#9F5F23', '#C498FF', '#BA86FF', '#AF73FD', '#9E60EF', '#8F4EE4', '#8243D6', '#7535C7', '#6C2DBD',
    '#642AAF', '#FFEB85', '#FFE767', '#FDE149', '#F7D93C', '#ECCF39', '#DDC12F', '#D2B729', '#C0AA33', '#9F9A23'
];

export default function getRandomColor() {
    const randomIndex = Math.floor(Math.random() * colors.length);

    return colors[randomIndex];
}
