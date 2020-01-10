precision highp float;
// Inspired by:
//  http://cmdrkitten.tumblr.com/post/172173936860

// this shader is from https://www.shadertoy.com/view/MlySD1

uniform vec2  iResolution;
uniform float iTime;
uniform int   AA;

//#define AA 4
#define time iTime
#define ITER 256
#define K 0.065
#define MAX_AA 10
//#define csqr(z)  mat2(z,-z.y,z.x) * z

float bailout = 1e2;

void main()
{
    vec3 col = vec3(0.0);
    for( int m=0; m<MAX_AA; m++ ) {
        if(m >= AA) { break; }
        for( int n=0; n<MAX_AA; n++ )
        {
            if(n >= AA) { break; }
            vec2 p = -1.0 + 2.0 * (gl_FragCoord.xy+vec2(float(m),float(n))/float(AA)) / iResolution.xy;
            p.x *= iResolution.x/iResolution.y;
            bailout = bailout * 4.;
            float t = smoothstep(0.0,1.0,((-cos(time*.1+2.)+1.0)/2.0));

            float zoom = 1.0/(t*63.0+1.0);

            vec2 c = vec2(-p.y-0.5,p.x);
            c= c/dot(c,c);
            c -= t*vec2(-2.94,4.1)*8.0;
            c *= zoom;
            vec2 z = vec2(0.0);

            int k=0;


            float curv = 0.;
            float rz = 0.;

            for(int i=0; i<ITER; i++ )
            {
                //            z = c + csqr(z);
                z = c + mat2(z,-z.y,z.x) * z;
                curv = (z.x*z.y/dot(z,z)+.35)*2.;
                rz = K* curv +(1.-K)*rz;
                if( dot(z,z)>bailout){k=i;break;}
            }
            rz = exp(-1.7*rz);
            if(dot(z,z)>bailout)
            col +=vec3(0.55,0.3,0.1)*(float(k)/50.0)+vec3(0.2*rz,rz,1.-2.5*rz)*0.9;
        }
    }

    col /= float(AA*AA);
    gl_FragColor = vec4( col, 1.0 );
}
