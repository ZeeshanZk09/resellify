import { TSlide, TBlogCard } from '@/shared/types/common';

export const SlidesData: TSlide[] = [
  {
    imgUrl: '/images/images/PS5.webp',
    url: '/shop',
    alt: 'shop',
    msg: {
      title: 'PLAY STATIONS',
      buttonText: 'Shop now!',
    },
  },
  {
    imgUrl: '/images/images/clothesAd.jpg',
    url: '/shop',
    alt: 'Clothes',
    msg: {
      title: 'Clothes',
      buttonText: 'Shop Now',
    },
  },
  {
    imgUrl: '/images/images/appleWatch.jpg',
    url: '/shop',
    alt: 'APPLE WATCH',
    msg: {
      title: 'WATCHES',
      buttonText: 'Show All',
    },
  },
  {
    imgUrl: '/images/images/appleAirpods.jpg',
    url: '/list/audio/headphones/apple',
    alt: '',
    msg: {
      title: 'AIRPODS',
      buttonText: 'Shop now!',
    },
  },
];

export const BlogCardData: TBlogCard[] = [
  {
    title: 'Praesent vestibulum nisi at mollis mollis',
    imgUrl: '/images/blog/blogPost1.avif',
    url: '#',
    shortText: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sit amet quam finibus,
     gravida mi in, fermentum est. Nulla lacinia, orci ac dictum euismod, ligula leo suscipit lectus,
      ac porttitor sem purus ac nisl. Nunc aliquet nisi tristique magna suscipit finibus. 
      Praesent vestibulum nisi at mollis mollis. Phasellus sollicitudin felis sit amet eros 
      accumsan rutrum. Phasellus est nisi, eleifend vel bibendum vitae, interdum ac tellus.`,
  },
  {
    title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    imgUrl: '/images/blog/blogPost2.avif',
    url: '#',
    shortText: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sit amet quam finibus,
    gravida mi in, fermentum est. Nulla lacinia, orci ac dictum euismod, ligula leo suscipit lectus,
     ac porttitor sem purus ac nisl. Nunc aliquet nisi tristique magna suscipit finibus. 
     Praesent vestibulum nisi at mollis mollis. Phasellus sollicitudin felis sit amet eros 
     accumsan rutrum. Phasellus est nisi, eleifend vel bibendum vitae, interdum ac tellus.`,
  },
  {
    title: 'Lorem ipsum dolor sit amet, consectetur',
    imgUrl: '/images/blog/blogPost3.avif',
    url: '#',
    shortText: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sit amet quam finibus,
    gravida mi in, fermentum est. Nulla lacinia, orci ac dictum euismod, ligula leo suscipit lectus,
     ac porttitor sem purus ac nisl. Nunc aliquet nisi tristique magna suscipit finibus. 
     Praesent vestibulum nisi at mollis mollis. Phasellus sollicitudin felis sit amet eros 
     accumsan rutrum. Phasellus est nisi, eleifend vel bibendum vitae, interdum ac tellus.`,
  },
];
