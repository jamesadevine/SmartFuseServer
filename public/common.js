function scrollTo(divname){
  //scroll to the div
  $('html,body').animate({
        scrollTop: $("#"+divname).offset().top},
        'slow');
}